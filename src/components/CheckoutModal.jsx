import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { generateWhatsAppLink, generateWhatsAppMessageText } from '../utils/whatsappGenerator';
import { analyticsService } from '../services/analyticsService';
import { orderService } from '../services/orderService';
import { supabase } from '../lib/supabaseClient';
import { queueOfflineOrder } from '../utils/offlineSync';
import OrderStatusView from './OrderStatusView';
import CheckoutUpsell from './CheckoutUpsell';
import { couponService } from '../services/couponService';
import { Ticket, X, CheckCircle2, Award, Star, UtensilsCrossed, Bike, User, Smartphone, MapPin, Banknote, CreditCard, ChevronRight, Clock, ShoppingBag } from 'lucide-react';
import { loyaltyService } from '../services/loyaltyService';
import MapPicker from './MapPicker';
import { getTranslation } from '../utils/i18n';
import { calculateDistance } from '../utils/geoUtils';

const CheckoutModal = ({ isOpen, onClose, restaurantId, restaurantSlug = '', whatsappNumber, features = {}, initialTable = '', deliveryConfig = {}, activeStaff = null, selectedLanguage = 'PT', restaurantClosed = false }) => {
    const navigate = useNavigate();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const t = (key) => getTranslation(selectedLanguage, key);

    // Form State
    const [step, setStep] = useState(1);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    }, [step]);
    const [orderType, setOrderType] = useState('dine-in'); // 'dine-in' | 'delivery'
    const [selectedZone, setSelectedZone] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [showUpsell, setShowUpsell] = useState(true);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    // Load draft when restaurantId changes
    useEffect(() => {
        if (!restaurantId) return;
        try {
            const draftStr = localStorage.getItem(`jindungo_checkout_draft_${restaurantId}`);
            if (draftStr) {
                const draft = JSON.parse(draftStr);
                if (draft) {
                    if (draft.step !== undefined) setStep(draft.step);
                    if (draft.orderType !== undefined) setOrderType(draft.orderType);
                    if (draft.customerName !== undefined) setCustomerName(draft.customerName);
                    if (draft.customerPhone !== undefined) setCustomerPhone(draft.customerPhone);
                    if (draft.tableNumber !== undefined) setTableNumber(draft.tableNumber);
                    if (draft.address !== undefined) setAddress(draft.address);
                    if (draft.addressReference !== undefined) setAddressReference(draft.addressReference);
                    if (draft.gpsCoords !== undefined) setGpsCoords(draft.gpsCoords);
                    if (draft.geolocationMode !== undefined) setGeolocationMode(draft.geolocationMode);
                    if (draft.paymentMethod !== undefined) setPaymentMethod(draft.paymentMethod);
                    if (draft.changeFor !== undefined) setChangeFor(draft.changeFor);
                    if (draft.selectedZone !== undefined) setSelectedZone(draft.selectedZone);
                    if (draft.showUpsell !== undefined) setShowUpsell(draft.showUpsell);
                    if (draft.isRedeemingLoyalty !== undefined) setIsRedeemingLoyalty(draft.isRedeemingLoyalty);
                    if (draft.couponCode !== undefined) setCouponCode(draft.couponCode);
                    if (draft.appliedCoupon !== undefined) setAppliedCoupon(draft.appliedCoupon);
                }
            } else {
                // Fallback to general saved client details
                const savedPhone = localStorage.getItem('customer_phone');
                if (savedPhone) setCustomerPhone(savedPhone);
                const savedName = localStorage.getItem('customer_name');
                if (savedName) setCustomerName(savedName);
                const savedAddr = localStorage.getItem('customer_last_address');
                if (savedAddr) setAddress(savedAddr);
                const savedRef = localStorage.getItem('customer_last_ref');
                if (savedRef) setAddressReference(savedRef);
                const savedGps = localStorage.getItem('customer_last_gps');
                if (savedGps) {
                    try { setGpsCoords(JSON.parse(savedGps)); } catch { /* ignore */ }
                }
                const savedGpsMode = localStorage.getItem('customer_last_gps_mode');
                if (savedGpsMode) setGeolocationMode(savedGpsMode);
            }
        } catch (e) {
            console.error("Failed to load checkout draft", e);
        } finally {
            setIsDraftLoaded(true);
        }
    }, [restaurantId]);

    // Dine-in fields
    const [tableNumber, setTableNumber] = useState(initialTable);

    // Update table number if prop changes
    useEffect(() => {
        if (initialTable) setTableNumber(initialTable);
    }, [initialTable]);

    // Delivery fields
    const [address, setAddress] = useState('');
    const [addressReference, setAddressReference] = useState('');
    const [gpsCoords, setGpsCoords] = useState(null);
    const [geolocationMode, setGeolocationMode] = useState('app_gps'); // 'app_gps' | 'whatsapp'

    // Background Geolocation for Delivery orders to always capture GPS coords
    useEffect(() => {
        if (isOpen && orderType === 'delivery' && !gpsCoords && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setGpsCoords(userLoc);
                // If address field is empty, auto-geocode it in background
                if (!address || address.trim() === '') {
                    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${userLoc.lat}&lon=${userLoc.lng}`, {
                         headers: { 
                             'Accept-Language': 'pt',
                             'User-Agent': 'MenusJindungos/1.1 (suporte@menusjindungos.com)'
                         }
                    })
                    .then(res => {
                        if (!res.ok) throw new Error(`Nominatim HTTP error: ${res.status}`);
                        return res.json();
                    })
                    .then(data => {
                        if (data && data.display_name) {
                            const parts = data.display_name.split(', ');
                            const cleanAddress = parts.slice(0, 3).join(', ');
                            setAddress(cleanAddress);
                        }
                    })
                    .catch(e => console.error("Erro background geocoding:", e));
                }
            }, () => {}, { enableHighAccuracy: true, timeout: 5000 });
        }
    }, [isOpen, orderType, gpsCoords]);

    // Payment fields
    const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'multicaixa'
    const [changeFor, setChangeFor] = useState('');

    // System Order State
    const [createdOrder, setCreatedOrder] = useState(null);
    const [isSending, setIsSending] = useState(false);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    // [REAL-TIME] Pre-Applied Coupon Loader
    useEffect(() => {
        if (isOpen && restaurantId) {
            const preApplied = localStorage.getItem(`jindungo_pre_applied_coupon_${restaurantId}`);
            if (preApplied) {
                setCouponCode(preApplied);
                setIsValidating(true);
                couponService.validateCoupon(restaurantId, preApplied).then(result => {
                    if (result.valid) {
                        const subtotal = getCartTotal();
                        if (result.coupon.min_purchase > 0 && subtotal < result.coupon.min_purchase) {
                            setCouponError(`${t('invalidCoupon')}: ${result.coupon.min_purchase} Kz`);
                            setAppliedCoupon(null);
                        } else {
                            setAppliedCoupon(result.coupon);
                            setCouponError('');
                            toast.success(`🎟️ Cupão "${preApplied}" aplicado com sucesso!`, { icon: '✨' });
                        }
                    } else {
                        setCouponError(result.message);
                        setAppliedCoupon(null);
                    }
                    setIsValidating(false);
                    localStorage.removeItem(`jindungo_pre_applied_coupon_${restaurantId}`);
                }).catch(err => {
                    console.error("Error pre-applying coupon:", err);
                    setIsValidating(false);
                });
            }
        }
    }, [isOpen, restaurantId]);

    // Loyalty State
    const [loyaltyConfig, setLoyaltyConfig] = useState(null);
    const [loyaltyPoints, setLoyaltyPoints] = useState(null);
    const [isRedeemingLoyalty, setIsRedeemingLoyalty] = useState(false);

    useEffect(() => {
        if (isOpen && createdOrder && restaurantId) {
            const sub = orderService.subscribeToOrders(restaurantId, (payload) => {
                if (payload.new && payload.new.id === createdOrder.id) {
                    setCreatedOrder(payload.new);
                }
            });
            return () => {
                supabase.removeChannel(sub); // Logic might differ based on library version, reusing simplified close
            };
        }
    }, [isOpen, createdOrder, restaurantId]);

    // Fetch Loyalty Config
    useEffect(() => {
        if (isOpen && restaurantId && features.canCollectClientData) {
            loyaltyService.getConfig(restaurantId).then(({ data }) => {
                if (data && data.is_active) setLoyaltyConfig(data);
            });
        }
    }, [isOpen, restaurantId, features.canCollectClientData]);

    const [hasGateway, setHasGateway] = useState(false);

    useEffect(() => {
        if (isOpen && restaurantId) {
            supabase.from('restaurants')
                .select('business_info')
                .eq('id', restaurantId)
                .single()
                .then(({ data }) => {
                    if (data?.business_info?.has_whatsapp_gateway) {
                        setHasGateway(true);
                    }
                });
        }
    }, [isOpen, restaurantId]);

    // Check Loyalty Points when phone changes
    useEffect(() => {
        if (customerPhone.length >= 7 && loyaltyConfig) {
            const timer = setTimeout(() => {
                loyaltyService.getCustomerPoints(restaurantId, customerPhone).then(({ count }) => {
                    setLoyaltyPoints(count);
                });
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setLoyaltyPoints(null);
            setIsRedeemingLoyalty(false);
        }
    }, [customerPhone, loyaltyConfig, restaurantId]);

    // Save draft when form state changes
    useEffect(() => {
        if (!restaurantId || !isDraftLoaded) return;
        const draft = {
            step,
            orderType,
            customerName,
            customerPhone,
            tableNumber,
            address,
            addressReference,
            gpsCoords,
            geolocationMode,
            paymentMethod,
            changeFor,
            selectedZone,
            showUpsell,
            isRedeemingLoyalty,
            couponCode,
            appliedCoupon
        };
        localStorage.setItem(`jindungo_checkout_draft_${restaurantId}`, JSON.stringify(draft));
    }, [
        restaurantId,
        isDraftLoaded,
        step,
        orderType,
        customerName,
        customerPhone,
        tableNumber,
        address,
        addressReference,
        gpsCoords,
        geolocationMode,
        paymentMethod,
        changeFor,
        selectedZone,
        showUpsell,
        isRedeemingLoyalty,
        couponCode,
        appliedCoupon
    ]);

    const [computedDeliveryFee, setComputedDeliveryFee] = useState(0);
    const [distanceKm, setDistanceKm] = useState(0);

    // [REAL-TIME] Calculate Dynamic Delivery Fee
    useEffect(() => {
        if (orderType === 'delivery') {
            const config = deliveryConfig || {};
            
            if (config.type === 'distance' && config.restaurant_location?.lat && gpsCoords?.lat) {
                const dist = calculateDistance(
                    config.restaurant_location.lat,
                    config.restaurant_location.lng,
                    gpsCoords.lat,
                    gpsCoords.lng
                );
                
                setDistanceKm(dist);
                const base = parseFloat(config.base_fee) || 0;
                const perKm = parseFloat(config.fee_per_km) || 0;
                const min = parseFloat(config.min_fee) || 0;
                
                const calculatedFee = base + (dist * perKm);
                const finalFee = Math.max(min, Math.round(calculatedFee));
                
                setComputedDeliveryFee(finalFee);
            } else if (config.type === 'zone' && selectedZone) {
                setComputedDeliveryFee(parseFloat(selectedZone.fee) || 0);
                setDistanceKm(0);
            } else {
                // Fallback to base delivery fee if configured and no coordinates yet
                const base = parseFloat(config.base_fee) || 0;
                setComputedDeliveryFee(base);
                setDistanceKm(0);
            }
        } else {
            setComputedDeliveryFee(0);
            setDistanceKm(0);
        }
    }, [orderType, selectedZone, gpsCoords, geolocationMode, deliveryConfig]);

    if (!isOpen) return null;

    const subtotal = getCartTotal();
    const deliveryFee = computedDeliveryFee;
    
    // Calculate Discount
    let discount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discount_type === 'percentage') {
            discount = (subtotal * appliedCoupon.discount_value) / 100;
        } else {
            discount = appliedCoupon.discount_value;
        }
    }

    const total = Math.max(0, subtotal + deliveryFee - discount);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsValidating(true);
        setCouponError('');

        const result = await couponService.validateCoupon(restaurantId, couponCode);

        if (result.valid) {
            // Check min purchase
            if (result.coupon.min_purchase > 0 && subtotal < result.coupon.min_purchase) {
                setCouponError(`${t('invalidCoupon')}: ${result.coupon.min_purchase} Kz`);
                setAppliedCoupon(null);
            } else {
                setAppliedCoupon(result.coupon);
                setCouponError('');
            }
        } else {
            setCouponError(result.message);
            setAppliedCoupon(null);
        }
        setIsValidating(false);
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
    };

    const handleSendOrder = async () => {
        if (restaurantClosed) {
            toast.error(`${t('restaurantClosed')}: ${t('closedMsg')}`);
            return;
        }
        if (isSending) return; // [SECURITY] Prevent Double-Click Race Condition
        if (orderType === 'dine-in' && !tableNumber) return toast.error(t('fillTableError'));
        if (orderType === 'delivery' && (!address || address.trim() === '')) {
            if (geolocationMode === 'whatsapp') {
                setAddress('Partilhar no WhatsApp 📍');
            } else {
                return toast.error(t('fillAddressError'));
            }
        }

        setIsSending(true);

        const distInfo = distanceKm > 0 ? ` | Distância: ${distanceKm.toFixed(1)}km` : '';
        const zoneInfo = (orderType === 'delivery' && selectedZone) ? `(${selectedZone.name} +${selectedZone.fee}Kz)` : '';
        const mapsLink = gpsCoords ? ` | Maps: https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}` : '';
        const refNote = addressReference ? ` | Ref: ${addressReference}` : '';
        
        let baseTableOrAddress = '';
        if (orderType === 'dine-in') {
            baseTableOrAddress = `Mesa: ${tableNumber}`;
        } else if (orderType === 'takeaway') {
            baseTableOrAddress = `Takeaway / Recolha (Pronto em 30-40 min)`;
        } else {
            const gpsInfo = geolocationMode === 'whatsapp' ? ' [GPS via WhatsApp]' : '';
            baseTableOrAddress = `Entrega: ${address || 'Partilhar no WhatsApp 📍'}${refNote}${mapsLink}${distInfo} ${zoneInfo}${gpsInfo}`;
        }
        
        let paymentInfo = '';
        if (paymentMethod === 'cash') {
            paymentInfo = t('cash') + (changeFor ? ` (Troco para: ${changeFor})` : '');
        } else if (paymentMethod === 'express') {
            paymentInfo = 'Express';
        } else if (paymentMethod === 'transferencia') {
            paymentInfo = 'Transferência';
        } else {
            paymentInfo = paymentMethod;
        }

        const orderData = {
            restaurant_id: restaurantId,
            items: cartItems,
            total: total,
            status: (paymentMethod === 'express' || paymentMethod === 'transferencia') ? 'waiting_payment' : 'pending',
            customer_name: customerName || 'Cliente',
            customer_phone: customerPhone,
            table_number: `${baseTableOrAddress} | Pgto: ${paymentInfo}`,
            coupon_id: appliedCoupon?.id || null,
            coupon_code: appliedCoupon?.code || null,
            coupon_discount: discount,
            is_loyalty_redemption: isRedeemingLoyalty,
            loyalty_reward_text: isRedeemingLoyalty ? loyaltyConfig?.reward_text : null,
            staff_member_id: activeStaff ? activeStaff.id : null,
            staff_member_name: activeStaff ? activeStaff.name : null,
            // [NEW] Logistics fields
            order_type: orderType,
            delivery_address: orderType === 'delivery' ? (address || 'Partilhar no WhatsApp 📍') : null,
            delivery_neighborhood: orderType === 'delivery' && selectedZone ? selectedZone.name : null,
            delivery_reference: orderType === 'delivery' ? (addressReference ? addressReference + ((geolocationMode === 'app_gps' && gpsCoords) ? ` | GPS: ${gpsCoords.lat},${gpsCoords.lng}` : (geolocationMode === 'whatsapp' ? ' | GPS: Via WhatsApp' : '')) : ((geolocationMode === 'app_gps' && gpsCoords) ? `GPS: ${gpsCoords.lat},${gpsCoords.lng}` : (geolocationMode === 'whatsapp' ? 'GPS: Via WhatsApp' : null))) : null,
            delivery_fee: orderType === 'delivery' ? deliveryFee : 0,
            takeaway_time: orderType === 'takeaway' ? '30-40 min' : null
        };

        try {
            // 1. Create System Order (if restaurantId exists)
            let newOrder = null;
            let isOfflineOrder = false;

            if (restaurantId) {
                if (!navigator.onLine) {
                    isOfflineOrder = true;
                } else {
                    const { data, error } = await orderService.createOrder(orderData);
                    if (error) {
                        // Keep permanent database constraint violations (e.g. stock or security) throwing so user sees them
                        if (error.message && (error.message.includes('stock') || error.message.includes('Security') || error.message.includes('Estoque'))) {
                            throw error;
                        }
                        // Treat generic network exceptions as offline
                        isOfflineOrder = true;
                    } else {
                        newOrder = data;
                    }
                }

                if (isOfflineOrder) {
                    const tempId = queueOfflineOrder(orderData);
                    newOrder = {
                        id: tempId,
                        ...orderData,
                        status: 'pending'
                    };

                    toast.success("🛎️ Encomenda registada com sucesso no telemóvel! A sua ligação à internet está instável, por isso guardámos o pedido localmente e iremos sincronizá-lo assim que a sua rede estabilizar.", {
                        icon: '🔌',
                        duration: 8000,
                        style: {
                            background: '#161616',
                            color: '#fff',
                            borderRadius: '20px',
                            border: '1px solid #D4AF37',
                            fontFamily: 'serif',
                            padding: '16px 20px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
                            fontSize: '13px',
                            fontWeight: '600'
                        }
                    });
                }

                // Fluxo de Pagamento MCX Real
                if (paymentMethod === 'multicaixa' && !isOfflineOrder) {
                    toast.loading(t('mcxStartingPayment'), { id: 'mcx-toast' });
                    const { data: mcxData, error: mcxError } = await supabase.functions.invoke('process-payment', {
                        body: { 
                            amount: total, 
                            phone: customerPhone,
                            order_id: newOrder.id,
                            restaurant_id: restaurantId
                        }
                    });

                    if (mcxError || mcxData?.error) {
                        toast.error(mcxData?.error || t('mcxPaymentFailure'), { id: 'mcx-toast' });
                        await orderService.updateOrderStatus(newOrder.id, 'cancelled', 'Falha no gateway MCX');
                        setIsSending(false);
                        return; // Stop flow
                    }

                    toast.success(t('mcxPinConfirm'), { id: 'mcx-toast', duration: 10000 });
                }

                setCreatedOrder(newOrder);
                clearCart();
                
                // Save customer info for future visits
                localStorage.setItem('customer_phone', customerPhone);
                localStorage.setItem('customer_name', customerName);
                if (orderType === 'delivery') {
                    if (address) localStorage.setItem('customer_last_address', address);
                    if (addressReference) localStorage.setItem('customer_last_ref', addressReference);
                    if (gpsCoords) localStorage.setItem('customer_last_gps', JSON.stringify(gpsCoords));
                    localStorage.setItem('customer_last_gps_mode', geolocationMode);
                }

                // Save to client's recent orders list for restoration
                try {
                    const recentKey = `jindungo_client_orders_${restaurantId}`;
                    const existingRecent = JSON.parse(localStorage.getItem(recentKey) || '[]');
                    const orderItem = {
                        id: newOrder.id,
                        timestamp: Date.now(),
                        total: total,
                        status: newOrder.status,
                        itemsCount: cartItems.reduce((acc, i) => acc + i.quantity, 0)
                    };
                    const filtered = existingRecent.filter(o => o.id !== newOrder.id);
                    filtered.unshift(orderItem);
                    localStorage.setItem(recentKey, JSON.stringify(filtered.slice(0, 5)));
                    window.dispatchEvent(new Event('jindungo_orders_updated'));
                } catch (e) {
                    console.error("Failed to save recent order", e);
                }

                // Clear the checkout draft and open state
                localStorage.removeItem(`jindungo_checkout_draft_${restaurantId}`);
                if (restaurantSlug) {
                    localStorage.removeItem(`jindungo_checkout_open_${restaurantSlug}`);
                }
                
                if (isOfflineOrder) {
                    // Store active order as offline pending tracking
                    localStorage.setItem(`jindungo_active_order_${restaurantId}`, JSON.stringify({
                        id: newOrder.id,
                        timestamp: Date.now(),
                        isOffline: true
                    }));
                    window.dispatchEvent(new Event('jindungo_new_order'));
                } else if (features?.canUseKDS) {
                    // Save active order for the sophisticated tracking flow
                    localStorage.setItem(`jindungo_active_order_${restaurantId}`, JSON.stringify({
                        id: newOrder.id,
                        timestamp: Date.now()
                    }));
                    // Dispatch event so ActiveOrderTracker catches it immediately
                    window.dispatchEvent(new Event('jindungo_new_order'));
                }
            }

            // 2. Track Analytics
            if (restaurantId) {
                analyticsService.incrementOrders(restaurantId, cartItems);
            }

            // 3. Fallback/Notification via WhatsApp
            if (!features?.canUseKDS || !restaurantId) {
                if (!restaurantId) {
                    toast.success(t('previewModeMsg'));
                }
                const effectiveWhatsapp = whatsappNumber || '244923000000';

                // Check if background gateway is configured
                if (hasGateway) {
                    const messageText = generateWhatsAppMessageText(cartItems, total, orderType, {
                        ...orderData,
                        paymentMethod,
                        changeFor,
                        tableNumber,
                        restaurantSlug: restaurantSlug,
                        geolocationMode: geolocationMode,
                        locationLink: gpsCoords ? `https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}` : null
                    });
                    
                    // Envia mensagem em segundo plano adicionando à fila Outbox (OWASP A01:2021)
                    supabase.from('whatsapp_outbox_messages')
                        .insert([{
                            restaurant_id: restaurantId,
                            phone: effectiveWhatsapp,
                            message: messageText,
                            status: 'pending'
                        }])
                        .then(({ error: outboxError }) => {
                            if (outboxError) {
                                console.error("Erro ao inserir mensagem na fila Outbox:", outboxError);
                            } else {
                                toast.success(
                                    selectedLanguage === 'PT'
                                        ? 'Pedido na fila de envio de WhatsApp!'
                                        : 'Order queued for WhatsApp delivery!',
                                    { icon: '📲' }
                                );
                            }
                        });

                    // Proceed inside the app with internal tracking
                    toast.success(t('orderSuccessMsg'), {
                        icon: '🚀',
                        duration: 5000
                    });
                    closeAndReset();
                    if (newOrder) {
                        navigate(`/track/${newOrder.id}`);
                    }
                    return;
                }

                // Fallback to manual wa.me link
                const link = generateWhatsAppLink(cartItems, total, orderType, { 
                    ...orderData, 
                    paymentMethod, 
                    changeFor, 
                    tableNumber, 
                    restaurantSlug: restaurantSlug, 
                    geolocationMode: geolocationMode,
                    locationLink: gpsCoords ? `https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}` : null 
                }, effectiveWhatsapp);
                if (!link) {
                    toast.error(t('whatsappError'));
                    setIsSending(false);
                    return;
                }
                const cacheBusterLink = link + (link.includes('?') ? '&' : '?') + 't=' + Date.now();
                window.location.href = cacheBusterLink;

                // If it's a real restaurant but no KDS, we can still close since WhatsApp is the main channel
                if (!features?.canUseKDS && restaurantId) {
                    onClose(); // Just close cart, they are on WhatsApp now
                    return; // Stop here so it doesn't show the OrderStatusView which implies an internal tracking
                }
            } else {
                // If it is a plan WITH KDS but has a gateway configured, also dispatch a background WhatsApp notification as receipt/alert!
                if (hasGateway) {
                    const effectiveWhatsapp = whatsappNumber || '244923000000';
                    const messageText = generateWhatsAppMessageText(cartItems, total, orderType, {
                        ...orderData,
                        paymentMethod,
                        changeFor,
                        tableNumber,
                        restaurantSlug: restaurantSlug,
                        geolocationMode: geolocationMode,
                        locationLink: gpsCoords ? `https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}` : null
                    });
                    
                    // Envia notificação em segundo plano via fila Outbox (KDS)
                    supabase.from('whatsapp_outbox_messages')
                        .insert([{
                            restaurant_id: restaurantId,
                            phone: effectiveWhatsapp,
                            message: messageText,
                            status: 'pending'
                        }])
                        .catch(e => {
                            console.error("Failed to queue background notification for KDS order", e);
                        });
                }

                toast.success(t('orderSuccessMsg'), {
                    icon: '🚀',
                    duration: 5000
                });
                closeAndReset();
                if (newOrder) {
                    navigate(`/track/${newOrder.id}`);
                }
            }

        } catch (err) {
            const errMsg = err.message || '';
            console.error('Checkout error:', err);

            // Handle out-of-stock database trigger exceptions with a highly friendly and premium notification
            if (errMsg.includes('Não há stock suficiente')) {
                const match = errMsg.match(/o prato "(.*?)"/);
                const dishName = match ? match[1] : 'item selecionado';

                toast.error(
                    `Pedimos desculpa! O item "${dishName}" esgotou-se no estoque enquanto finalizava a sua compra. Por favor, ajuste ou remova-o do seu carrinho para concluir.`,
                    {
                        icon: '🛎️',
                        duration: 6000,
                        style: {
                            background: '#161616',
                            color: '#fff',
                            borderRadius: '20px',
                            border: '1px solid rgba(212, 175, 55, 0.4)',
                            fontFamily: 'serif',
                            padding: '16px 22px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            fontWeight: '600'
                        }
                    }
                );
            } else {
                toast.error(`Aviso: ${errMsg}`, {
                    icon: '⚠️',
                    duration: 5000,
                    style: {
                        background: '#161616',
                        color: '#fff',
                        borderRadius: '20px',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        fontFamily: 'serif',
                        padding: '16px 22px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.85)',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        fontWeight: '600'
                    }
                });
            }
        } finally {
            setIsSending(false);
        }
    };

    const closeAndReset = () => {
        setCreatedOrder(null);
        setIsRedeemingLoyalty(false);
        onClose();
        // Cart is cleared on success, so user starts fresh

        // Clear checkout states after order placed or cancelled/finished
        localStorage.removeItem(`jindungo_checkout_draft_${restaurantId}`);
        if (restaurantSlug) {
            localStorage.removeItem(`jindungo_checkout_open_${restaurantSlug}`);
        }
    };

    // If order created, we DO NOT show the modal here anymore, the Tracker takes over.
    // We just return null if success (though closeAndReset handles it, we keep this as safeguard)
    if (createdOrder) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-md bg-white/95 backdrop-blur-xl text-gray-900 rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl relative border-t border-x sm:border border-white/20 animate-in slide-in-from-bottom-10 duration-500 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >

                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

                <div className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h2 className="text-2xl font-serif font-black text-gray-900 leading-tight">
                            {features?.hasUpsell && showUpsell ? t('upsellSuggestions') : t('checkout')}
                        </h2>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mt-1">
                            {cartItems.length} {t('itemsSelected')}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 animate-in spin-in-12"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-0.5 custom-scrollbar scrollbar-hide space-y-6">
                    {features?.hasUpsell && showUpsell ? (
                        <CheckoutUpsell
                            restaurantId={restaurantId}
                            cartItems={cartItems}
                            onContinue={() => setShowUpsell(false)}
                            onCancel={onClose}
                        />
                    ) : (
                        <>
                        {/* Step Navigation Header */}
                        <div className="flex items-center justify-between mb-6 border-b pb-4 border-gray-200/60">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <button onClick={() => setStep(1)} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${step === 1 ? 'bg-[#D4AF37] text-black shadow-md ring-2 ring-[#D4AF37]/30' : (step > 1 ? 'bg-green-600 text-white font-bold' : 'bg-gray-200 text-gray-500')}`}>1</button>
                                <div className={`w-4 sm:w-8 h-1 rounded transition-all ${step >= 2 ? 'bg-[#D4AF37]' : 'bg-gray-200'}`}></div>
                                <button onClick={() => step > 1 && setStep(2)} disabled={step < 2} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${step === 2 ? 'bg-[#D4AF37] text-black shadow-md ring-2 ring-[#D4AF37]/30' : (step > 2 ? 'bg-green-600 text-white font-bold' : 'bg-gray-200 text-gray-500')}`}>2</button>
                                <div className={`w-4 sm:w-8 h-1 rounded transition-all ${step >= 3 ? 'bg-[#D4AF37]' : 'bg-gray-200'}`}></div>
                                <button onClick={() => step > 2 && setStep(3)} disabled={step < 3} className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${step === 3 ? 'bg-[#D4AF37] text-black shadow-md ring-2 ring-[#D4AF37]/30' : 'bg-gray-200 text-gray-500'}`}>3</button>
                            </div>
                            <span className="text-[11px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">
                                {step === 1 ? t('stepOrder') : (step === 2 ? t('stepDetails') : t('stepPayment'))}
                            </span>
                        </div>

                        {restaurantClosed && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-700 animate-pulse">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <h4 className="font-bold text-sm">{t('restaurantClosed')}</h4>
                                    <p className="text-xs opacity-90 mt-0.5">{t('closedMsg')}</p>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Premium Tabs Order Type */}
                                <div className="flex flex-col sm:flex-row bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-[20px] border border-gray-200/50 shadow-inner gap-1.5">
                                    <button
                                        onClick={() => setOrderType('dine-in')}
                                        className={`flex-1 py-3 px-4 rounded-[14px] flex items-center justify-center gap-2 transition-all duration-500 font-bold text-sm ${orderType === 'dine-in' ? 'bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-1 ring-black/5 scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                    >
                                        <UtensilsCrossed size={16} className={orderType === 'dine-in' ? 'animate-bounce-short' : ''} />
                                        <span>{t('dineIn')}</span>
                                    </button>
                                    <button
                                        onClick={() => setOrderType('takeaway')}
                                        className={`flex-1 py-3 px-4 rounded-[14px] flex items-center justify-center gap-2 transition-all duration-500 font-bold text-sm ${orderType === 'takeaway' ? 'bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-1 ring-black/5 scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                    >
                                        <ShoppingBag size={16} className={orderType === 'takeaway' ? 'animate-bounce-short' : ''} />
                                        <span>{t('takeaway')}</span>
                                    </button>
                                    <button
                                        onClick={() => setOrderType('delivery')}
                                        className={`flex-1 py-3 px-4 rounded-[14px] flex items-center justify-center gap-2 transition-all duration-500 font-bold text-sm ${orderType === 'delivery' ? 'bg-white text-primary shadow-[0_4px_12px_rgba(0,0,0,0.1)] ring-1 ring-black/5 scale-[1.02]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                    >
                                        <Bike size={16} className={orderType === 'delivery' ? 'animate-bounce-short' : ''} />
                                        <span>{t('delivery')}</span>
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {cartItems.map(item => (
                                        <div key={item.cartItemId || item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4a5568' }}>
                                            <span>{item.quantity}x {item.name} {item.selectedVariant ? `(${item.selectedVariant})` : ''}</span>
                                            <span style={{ fontWeight: 'bold', color: '#1a202c' }}>
                                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price).replace('AOA', 'Kz')}
                                            </span>
                                        </div>
                                    ))}
                                    {(cartItems.length === 0) && <p className="text-gray-500">{t('emptyCart')}</p>}
                                </div>

                                <div style={{ borderTop: '1px dashed #e2e8f0', margin: '1rem 0' }} />

                                <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 shadow-sm">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                            <span>{t('subtotal')}</span>
                                            <span className="text-gray-900">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(subtotal).replace('AOA', 'Kz')}</span>
                                        </div>
                                        {deliveryFee > 0 && (
                                            <div className="flex justify-between items-center text-sm font-bold text-blue-600">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <Bike size={14} />
                                                        <span>{t('deliveryFee')}</span>
                                                    </div>
                                                    {distanceKm > 0 && (
                                                        <span className="text-[10px] font-medium text-blue-400 ml-5 tracking-tight">
                                                            Distância: {distanceKm.toFixed(1)} km
                                                        </span>
                                                    )}
                                                </div>
                                                <span>+{new Intl.NumberFormat('pt-AO').format(deliveryFee)} Kz</span>
                                            </div>
                                        )}
                                        {discount > 0 && (
                                            <div className="flex justify-between items-center text-sm font-bold text-green-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Ticket size={14} />
                                                    <span>{t('discount')} ({appliedCoupon?.code})</span>
                                                </div>
                                                <span>-{new Intl.NumberFormat('pt-AO').format(discount)} Kz</span>
                                            </div>
                                        )}
                                        <div className="pt-3 border-t border-gray-200/50 flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('totalToPay')}</span>
                                                <span className="text-3xl font-serif font-black text-gray-900 leading-none mt-1">
                                                    {new Intl.NumberFormat('pt-AO').format(total)}
                                                    <span className="text-xs ml-1 text-gray-400">Kz</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100/50 rounded-full text-green-700 text-[10px] font-black uppercase tracking-wider h-fit mb-1 border border-green-200/50">
                                                <CheckCircle2 size={10} />
                                                Seguro
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    disabled={cartItems.length === 0}
                                    className={`w-full p-4 sm:p-5 rounded-[24px] font-black text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${cartItems.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-[#D4AF37] text-black hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/20'}`}
                                >
                                    <span>{t('proceedToDetails')}</span>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <User size={12} className="text-gray-400" />
                                            {t('name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            placeholder="Ex: Ana Silva"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            <Smartphone size={12} className="text-gray-400" />
                                            {t('phone')}
                                        </label>
                                        <input
                                            type="tel"
                                            value={customerPhone}
                                            onChange={e => setCustomerPhone(e.target.value)}
                                            placeholder="9xx xxx xxx"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                                        />
                                    </div>
                                </div>

                                {orderType === 'dine-in' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('table')} (Número, Nome ou Letra)</label>
                                            {initialTable && tableNumber === initialTable && (
                                                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black border border-emerald-200">
                                                    ✓ {t('tableQR')}
                                                </span>
                                            )}
                                        </div>
                                        <input type="text" value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Ex: Mesa 4, Esplanada A..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 placeholder-gray-400 font-bold" />
                                    </div>
                                )}

                                {orderType === 'takeaway' && (
                                    <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl">
                                        <div className="flex items-center gap-3.5 mb-3.5">
                                            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
                                                <Clock size={22} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-amber-900">{t('estimatedPrepTime')}</h4>
                                                <p className="text-xs text-amber-700 font-bold">{t('readyInMinutes')}</p>
                                            </div>
                                        </div>
                                        <div 
                                            className="text-xs text-amber-900 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 leading-relaxed font-semibold"
                                            dangerouslySetInnerHTML={{ __html: t('pickupInstructions') }}
                                        />
                                    </div>
                                )}

                                {orderType === 'delivery' && (
                                    <div className="space-y-4">
                                        {localStorage.getItem('customer_last_address') && (!address || address === localStorage.getItem('customer_last_address')) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAddress(localStorage.getItem('customer_last_address') || '');
                                                    setAddressReference(localStorage.getItem('customer_last_ref') || '');
                                                    const savedGps = localStorage.getItem('customer_last_gps');
                                                    if (savedGps) try { setGpsCoords(JSON.parse(savedGps)); } catch { /* ignore */ }
                                                    toast.success(t('restoreAddress'));
                                                }}
                                                className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                            >
                                                <MapPin size={14} />
                                                {t('useLastAddress')}
                                            </button>
                                        )}

                                        {deliveryConfig?.enabled && deliveryConfig?.type === 'zone' && deliveryConfig?.zones?.length > 0 && (
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('address')}</label>
                                                <select
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 font-medium"
                                                    value={selectedZone ? JSON.stringify(selectedZone) : ''}
                                                    onChange={(e) => setSelectedZone(e.target.value ? JSON.parse(e.target.value) : null)}
                                                >
                                                    <option value="" className="text-gray-500">{t('selectNeighborhood')}</option>
                                                    {deliveryConfig.zones.map((zone, idx) => (
                                                        <option key={idx} value={JSON.stringify(zone)} className="text-gray-900">
                                                            {zone.name} (+{zone.fee} Kz)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Geolocation Mode Selector */}
                                        <div className="bg-gray-100/40 p-4 rounded-3xl border border-gray-150/50 space-y-3">
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider">
                                                {selectedLanguage === 'PT' ? 'Localização da Entrega' : 'Delivery Geolocation'}
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setGeolocationMode('app_gps');
                                                        if (address === 'Partilhar no WhatsApp 📍') setAddress('');
                                                    }}
                                                    className={`py-3 px-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                        geolocationMode === 'app_gps'
                                                            ? 'bg-amber-50 border-[#D4AF37] text-amber-900 font-extrabold shadow-sm'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <MapPin size={14} className={geolocationMode === 'app_gps' ? 'text-[#D4AF37]' : 'text-gray-400'} />
                                                    <span>{selectedLanguage === 'PT' ? 'Mapa do App (GPS)' : 'App Map (GPS)'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setGeolocationMode('whatsapp');
                                                        setAddress('Partilhar no WhatsApp 📍');
                                                    }}
                                                    className={`py-3 px-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                        geolocationMode === 'whatsapp'
                                                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-extrabold shadow-sm'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <svg className={`w-3.5 h-3.5 ${geolocationMode === 'whatsapp' ? 'text-emerald-500' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.982L2 22l5.233-1.371a9.994 9.994 0 004.779 1.21h.005c5.505 0 9.99-4.478 9.99-9.986 0-2.67-1.037-5.178-2.923-7.062A9.923 9.923 0 0012.012 2zM12 20.31a8.31 8.31 0 01-4.24-1.157l-.304-.18-3.15.825.84-3.072-.198-.314A8.324 8.324 0 013.684 12c0-4.593 3.733-8.327 8.325-8.327 2.225 0 4.316.866 5.89 2.44a8.27 8.27 0 012.433 5.893c0 4.593-3.733 8.327-8.328 8.327h-.004z" />
                                                    </svg>
                                                    <span>{selectedLanguage === 'PT' ? 'Partilhar no WhatsApp' : 'Share on WhatsApp'}</span>
                                                </button>
                                            </div>
                                        </div>

                                        {geolocationMode === 'app_gps' ? (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                        {t('tapMap')}
                                                    </label>
                                                    <MapPicker 
                                                        defaultLat={gpsCoords?.lat}
                                                        defaultLng={gpsCoords?.lng}
                                                        onLocationSelected={(pos, addr) => {
                                                            const isDifferent = !gpsCoords || (Math.abs(pos.lat - gpsCoords.lat) > 0.0001 || Math.abs(pos.lng - gpsCoords.lng) > 0.0001);
                                                            setGpsCoords(pos);
                                                            if (addr && (isDifferent || !address || address.trim() === '' || address === 'Partilhar no WhatsApp 📍')) {
                                                                setAddress(addr);
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('address')}</label>
                                                    <textarea
                                                        value={address === 'Partilhar no WhatsApp 📍' ? '' : address}
                                                        onChange={e => setAddress(e.target.value)}
                                                        placeholder="Ex: Talatona, Bloco C, Rua 28..."
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 placeholder-gray-400 font-medium"
                                                        rows={2}
                                                        style={{ resize: 'none' }}
                                                    />
                                                    {gpsCoords && (
                                                        <span className="text-[10px] text-gray-400 font-bold mt-1.5 block">
                                                            ℹ️ {selectedLanguage === 'PT' 
                                                                ? 'Mudar a morada escrita não move o pin no mapa. Ajuste o mapa acima se mudou de local.' 
                                                                : 'Changing the written address does not move the map pin. Adjust the map above if you changed location.'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex gap-3 text-xs text-emerald-950 font-medium leading-relaxed">
                                                    <span className="text-lg">📍</span>
                                                    <div>
                                                        <strong className="block font-bold text-emerald-900 mb-0.5">
                                                            {selectedLanguage === 'PT' ? 'Partilha pelo WhatsApp Ativa' : 'WhatsApp Location Share Active'}
                                                        </strong>
                                                        {selectedLanguage === 'PT' 
                                                            ? 'Após finalizar o pedido, partilhe a sua localização (atual ou em tempo real) diretamente no chat do WhatsApp com o restaurante.'
                                                            : 'After finalizing the order, share your location (current or live) directly in the WhatsApp chat with the restaurant.'}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                        {selectedLanguage === 'PT' ? 'Morada / Detalhes de Entrega (Opcional - ex: Apartamento/Bloco)' : 'Address / Delivery Details (Optional - e.g. Apartment/Block)'}
                                                    </label>
                                                    <textarea
                                                        value={address === 'Partilhar no WhatsApp 📍' ? '' : address}
                                                        onChange={e => setAddress(e.target.value)}
                                                        placeholder={selectedLanguage === 'PT' ? 'Ex: Apartamento 4B, Bloco C, Condomínio Girassol...' : 'Ex: Apartment 4B, Block C...'}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 placeholder-gray-400 font-medium"
                                                        rows={2}
                                                        style={{ resize: 'none' }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('reference')}</label>
                                            <input
                                                type="text"
                                                value={addressReference}
                                                onChange={e => setAddressReference(e.target.value)}
                                                placeholder="Ex: Perto do Shoprite, Em frente ao Banco BFA…"
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 placeholder-gray-400 font-medium"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-1/3 p-4 rounded-[20px] font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all flex items-center justify-center"
                                    >
                                        {t('back')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!customerName || !customerPhone) {
                                                toast.error(t('fillRequiredError'));
                                                return;
                                            }
                                            if (orderType === 'dine-in' && !tableNumber) {
                                                toast.error(t('fillTableError'));
                                                return;
                                            }
                                            if (orderType === 'delivery' && (!address || address.trim() === '')) {
                                                if (geolocationMode === 'whatsapp') {
                                                    setAddress('Partilhar no WhatsApp 📍');
                                                } else {
                                                    toast.error(t('fillAddressError'));
                                                    return;
                                                }
                                            }
                                            setStep(3);
                                        }}
                                        className="w-2/3 p-4 rounded-[20px] font-black text-sm sm:text-base bg-[#D4AF37] text-black hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                                    >
                                        <span>{t('proceedToPayment')}</span>
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* Coupon Section */}
                                <div style={{ background: 'rgba(212,175,55,0.05)', padding: '1rem', borderRadius: '16px', border: '1px dashed rgba(212,175,55,0.2)' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '800', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {t('couponCode')}
                                    </label>

                                    {!appliedCoupon ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                placeholder={t('couponPlaceholder')}
                                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/20 outline-none text-gray-900 bg-white font-bold"
                                                style={{ margin: 0, textTransform: 'uppercase' }}
                                                value={couponCode}
                                                onChange={e => setCouponCode(e.target.value)}
                                                onKeyPress={e => e.key === 'Enter' && handleApplyCoupon()}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode || isValidating}
                                                style={{ background: '#D4AF37', color: 'black', border: 'none', padding: '0 1rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
                                            >
                                                {isValidating ? '...' : t('apply')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #c6f6d5' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2f855a', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                <CheckCircle2 size={16} /> {appliedCoupon.code}
                                            </div>
                                            <button type="button" onClick={removeCoupon} style={{ background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {couponError && (
                                        <p style={{ color: '#e53e3e', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 'bold' }}>{couponError}</p>
                                    )}
                                </div>

                                {/* Loyalty Card */}
                                {loyaltyConfig && loyaltyPoints !== null && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.05) 100%)',
                                        padding: '1.2rem',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(212,175,55,0.2)',
                                        animation: 'fadeIn 0.4s'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Award size={18} style={{ color: '#D4AF37' }} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {t('loyaltyCard')} {loyaltyPoints}/{loyaltyConfig.goal}
                                                </span>
                                            </div>
                                            {loyaltyPoints >= loyaltyConfig.goal && (
                                                <span style={{ fontSize: '0.7rem', background: '#38a169', color: 'white', padding: '2px 8px', borderRadius: '8px', fontWeight: 'bold' }}>
                                                    {t('rewardReady')}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {[...Array(loyaltyConfig.goal)].map((_, i) => (
                                                <div key={i} style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    border: i < loyaltyPoints ? 'none' : '2px dashed rgba(0,0,0,0.1)',
                                                    background: i < loyaltyPoints ? '#D4AF37' : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: i < loyaltyPoints ? 'black' : 'rgba(0,0,0,0.1)'
                                                }}>
                                                    <Star size={10} fill={i < loyaltyPoints ? "currentColor" : "none"} />
                                                </div>
                                            ))}
                                        </div>

                                        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '1rem', textAlign: 'center', fontStyle: 'italic' }}>
                                            {loyaltyPoints >= loyaltyConfig.goal
                                                ? `${t('congrats')} ${t('rewardReady')}: ${loyaltyConfig.reward_text}`
                                                : `${t('rewardProgress')} ${loyaltyConfig.goal - loyaltyPoints} ${t('rewardRemaining')}`
                                            }
                                        </p>

                                        {loyaltyPoints >= loyaltyConfig.goal && (
                                            <div className="mt-4 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-between shadow-sm animate-bounce-short">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-[#D4AF37] p-2 rounded-full text-black">
                                                        <Award size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-800">{t('useReward')}</p>
                                                        <p className="text-[10px] text-gray-500">{loyaltyConfig.reward_text}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRedeemingLoyalty(!isRedeemingLoyalty)}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${isRedeemingLoyalty ? 'bg-[#38a169]' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRedeemingLoyalty ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payment Methods */}
                                <div className="p-4 sm:p-5 bg-gray-50 rounded-2xl sm:rounded-[24px] border border-gray-100 shadow-sm">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t('paymentMethod')}</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('cash')}
                                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${paymentMethod === 'cash' ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                                        >
                                            <Banknote size={18} />
                                            <span>{t('cash')}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('express')}
                                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${paymentMethod === 'express' ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                                        >
                                            <Smartphone size={18} />
                                            <span>Express</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('transferencia')}
                                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-bold text-sm ${paymentMethod === 'transferencia' ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                                        >
                                            <CreditCard size={18} />
                                            <span>Transferência</span>
                                        </button>
                                    </div>

                                    {paymentMethod === 'cash' && (
                                        <div className="mt-2 animate-in slide-in-from-right duration-300">
                                            <input
                                                type="text"
                                                placeholder={t('changeForPlaceholder')}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none transition-all text-sm font-medium text-gray-900 placeholder-gray-400"
                                                value={changeFor}
                                                onChange={e => setChangeFor(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {(paymentMethod === 'express' || paymentMethod === 'multicaixa') && (
                                        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl animate-in slide-in-from-right duration-300">
                                            <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Smartphone size={14} /> {t('autoPayment')}
                                            </h4>
                                            <div className="space-y-3">
                                                <input
                                                    type="tel"
                                                    placeholder={t('mcxPhonePlaceholder')}
                                                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all text-sm font-bold text-gray-900 placeholder-gray-400"
                                                    value={customerPhone}
                                                    onChange={e => setCustomerPhone(e.target.value)}
                                                />
                                                <div className="text-xs text-blue-600/80 font-medium space-y-1 ml-1 border-l-2 border-blue-200 pl-3">
                                                    <p>1. {t('mcxStep1')}</p>
                                                    <p>2. {t('mcxStep2')}</p>
                                                    <p>3. {t('mcxStep3')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Final Total Box */}
                                <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 shadow-sm">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                                            <span>{t('subtotal')}</span>
                                            <span className="text-gray-900">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(subtotal).replace('AOA', 'Kz')}</span>
                                        </div>
                                        {deliveryFee > 0 && (
                                            <div className="flex justify-between items-center text-sm font-bold text-blue-600">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <Bike size={14} />
                                                        <span>{t('deliveryFee')}</span>
                                                    </div>
                                                    {distanceKm > 0 && (
                                                        <span className="text-[10px] font-medium text-blue-400 ml-5 tracking-tight">
                                                            Distância: {distanceKm.toFixed(1)} km
                                                        </span>
                                                    )}
                                                </div>
                                                <span>+{new Intl.NumberFormat('pt-AO').format(deliveryFee)} Kz</span>
                                            </div>
                                        )}
                                        {discount > 0 && (
                                            <div className="flex justify-between items-center text-sm font-bold text-green-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Ticket size={14} />
                                                    <span>{t('discount')} ({appliedCoupon?.code})</span>
                                                </div>
                                                <span>-{new Intl.NumberFormat('pt-AO').format(discount)} Kz</span>
                                            </div>
                                        )}
                                        <div className="pt-3 border-t border-gray-200/50 flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{t('totalToPay')}</span>
                                                <span className="text-3xl font-serif font-black text-gray-900 leading-none mt-1">
                                                    {new Intl.NumberFormat('pt-AO').format(total)}
                                                    <span className="text-xs ml-1 text-gray-400">Kz</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100/50 rounded-full text-green-700 text-[10px] font-black uppercase tracking-wider h-fit mb-1 border border-green-200/50">
                                                <CheckCircle2 size={10} />
                                                Seguro
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="w-1/3 p-4 rounded-[20px] font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all flex items-center justify-center"
                                    >
                                        {t('back')}
                                    </button>
                                    <div className="w-2/3">
                                        <button
                                            type="button"
                                            onClick={handleSendOrder}
                                            disabled={cartItems.length === 0 || isSending || restaurantClosed}
                                            className={`w-full group relative overflow-hidden p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] font-black text-base sm:text-lg transition-all ${cartItems.length === 0 || isSending || restaurantClosed ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                                            style={{
                                                background: 'linear-gradient(135deg, #1A1A1A 0%, #333 100%)',
                                                color: '#D4AF37',
                                                boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                            
                                            <div className="flex items-center justify-center gap-3 relative z-10">
                                                {isSending ? (
                                                    <div className="w-6 h-6 border-4 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <span>{restaurantClosed ? t('restaurantClosed') : ((features?.canUseKDS && restaurantId) ? t('sendOrder') : t('sendOrderWhatsapp'))}</span>
                                                        {!restaurantClosed && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default CheckoutModal;
