import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { compressImage } from '../lib/imageUtils';
import toast from 'react-hot-toast';

export const useAdminData = (user) => {
    const [restaurant, setRestaurant] = useState(null);
    const [categories, setCategories] = useState([]);
    const [businessInfo, setBusinessInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState({
        primaryColor: '#D4AF37',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        layoutMode: 'list',
        darkMode: false,
        whatsappNumber: '',
        logoUrl: ''
    });

    const fetchRestaurantData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const masqueradeId = localStorage.getItem('masquerade_restaurant_id');
            let query = supabase.from('restaurants').select('*');
            if (masqueradeId) {
                query = query.eq('id', masqueradeId);
            } else {
                query = query.eq('owner_id', user.id);
            }

            const { data: restaurants, error: rError } = await query;
            if (rError) throw rError;

            let currentRestaurant = restaurants?.[0];
            if (currentRestaurant) {
                setRestaurant(currentRestaurant);
                if (currentRestaurant.theme_config) {
                    setConfig(prev => ({ ...prev, ...currentRestaurant.theme_config }));
                }
                if (currentRestaurant.business_info) {
                    setBusinessInfo(currentRestaurant.business_info);
                }

                const { data: cats, error: cError } = await supabase
                    .from('categories')
                    .select('*, items:menu_items(*)')
                    .eq('restaurant_id', currentRestaurant.id)
                    .order('sort_order');

                if (cError) throw cError;
                setCategories(cats || []);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error("Erro ao carregar dados do restaurante");
        } finally {
            setLoading(false);
        }
    }, [user]);

    const handleConfigChange = async (newConfig) => {
        const updated = typeof newConfig === 'function' ? newConfig(config) : newConfig;
        setConfig(updated);
        if (restaurant) {
            try {
                await supabase.from('restaurants').update({ theme_config: updated }).eq('id', restaurant.id);
            } catch (err) {
                console.error("Erro ao salvar config:", err);
            }
        }
    };

    const handleBusinessInfoSave = async (newInfo) => {
        setBusinessInfo(newInfo);
        if (restaurant) {
            try {
                await supabase.from('restaurants').update({ business_info: newInfo }).eq('id', restaurant.id);
                toast.success("Informações atualizadas!");
            } catch (err) {
                toast.error("Erro ao salvar informações");
            }
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !restaurant) return;
        try {
            toast.loading("Otimizando logotipo...", { id: 'logo-upload' });
            const uploadFile = await compressImage(file, 400, 0.85);
            const fileExt = uploadFile.name.split('.').pop() || 'png';
            const fileName = `logos/${restaurant.id}/logo_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('menus').upload(fileName, uploadFile, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);
            await handleConfigChange(prev => ({ ...prev, logoUrl: publicUrl }));
            toast.success("Logotipo atualizado!", { id: 'logo-upload' });
        } catch (error) {
            toast.error("Erro ao salvar logotipo", { id: 'logo-upload' });
        }
    };

    const handleHeaderBgUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !restaurant) return;
        try {
            toast.loading("Otimizando capa...", { id: 'capa-upload' });
            const uploadFile = await compressImage(file, 1600, 0.75);
            const fileExt = uploadFile.name.split('.').pop() || 'jpg';
            const fileName = `headers/${restaurant.id}/headbg_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('menus').upload(fileName, uploadFile, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('menus').getPublicUrl(fileName);
            await handleConfigChange(prev => ({ ...prev, headerBgUrl: publicUrl }));
            toast.success("Capa atualizada!", { id: 'capa-upload' });
        } catch (error) {
            toast.error("Erro ao carregar a capa", { id: 'capa-upload' });
        }
    };

    useEffect(() => {
        fetchRestaurantData();
    }, [fetchRestaurantData]);

    return { 
        restaurant, setRestaurant, categories, businessInfo, loading, config, 
        handleConfigChange, handleBusinessInfoSave, handleLogoUpload, handleHeaderBgUpload, fetchRestaurantData 
    };
};
