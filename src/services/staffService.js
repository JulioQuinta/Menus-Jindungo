import { supabase } from '../lib/supabaseClient';

export const normalizeStaffRole = (rawRole) => {
    const r = String(rawRole || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (r === 'kitchen' || r.includes('cozinh') || r.includes('chef') || r.includes('kds')) return 'kitchen';
    if (r === 'reception' || r.includes('caixa') || r.includes('recep') || r.includes('balcao') || r.includes('pos')) return 'reception';
    if (r === 'admin' || r.includes('gerent') || r.includes('admin') || r.includes('dono')) return 'admin';
    return 'waiter'; // Default para Garçom / Sala ('garcom', 'waiter', 'atendente', etc.)
};

const DEFAULT_DEMO_STAFF = [
    { id: 'demo-1', name: 'Chef Mateus (Cozinha KDS)', role: 'kitchen', pin_code: '1111', email: 'cozinha@restaurante.ao', active: true },
    { id: 'demo-2', name: 'António Quintas (Garçom)', role: 'waiter', pin_code: '1234', email: 'antonio@restaurante.ao', active: true },
    { id: 'demo-3', name: 'Pedro Julio (Garçom)', role: 'waiter', pin_code: '2468', email: 'pedro@restaurante.ao', active: true },
    { id: 'demo-5', name: 'Carla Silva (Caixa POS)', role: 'reception', pin_code: '5555', email: 'caixa@restaurante.ao', active: true }
];

const ensureCompleteOperationalTeam = (list) => {
    const normalized = (Array.isArray(list) ? list : []).map(item => ({
        ...item,
        role: normalizeStaffRole(item.role)
    }));
    const hasKitchen = normalized.some(s => s.role === 'kitchen');
    const hasReception = normalized.some(s => s.role === 'reception');
    const result = [...normalized];
    if (!hasKitchen) {
        result.push({
            id: 'demo-kitchen-kds',
            name: 'Chef Mateus (Cozinha KDS)',
            role: 'kitchen',
            pin_code: '1111',
            email: 'cozinha@jindungo.ao',
            active: true
        });
    }
    if (!hasReception) {
        result.push({
            id: 'demo-reception-pos',
            name: 'Carla Silva (Caixa POS)',
            role: 'reception',
            pin_code: '5555',
            email: 'caixa@jindungo.ao',
            active: true
        });
    }
    return result;
};

const getOfflineStaffCache = (restaurantId) => {
    try {
        const raw = localStorage.getItem(`jindungo_offline_staff_${restaurantId}`);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return ensureCompleteOperationalTeam(parsed);
        }
    } catch (e) {
        console.warn('Erro ao ler cache offline de staff:', e);
    }
    return ensureCompleteOperationalTeam(DEFAULT_DEMO_STAFF);
};

const saveOfflineStaffCache = (restaurantId, list) => {
    try {
        if (restaurantId && Array.isArray(list)) {
            localStorage.setItem(`jindungo_offline_staff_${restaurantId}`, JSON.stringify(list));
        }
    } catch (e) {
        console.warn('Erro ao guardar cache offline de staff:', e);
    }
};

export const staffService = {
    async getStaff(restaurantId) {
        if (!restaurantId) return ensureCompleteOperationalTeam(DEFAULT_DEMO_STAFF);
        try {
            const { data, error } = await supabase
                .from('staff_members')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('name');

            if (error) throw error;
            if (data && data.length > 0) {
                const completeList = ensureCompleteOperationalTeam(data);
                saveOfflineStaffCache(restaurantId, completeList);
                return completeList;
            }
            return getOfflineStaffCache(restaurantId);
        } catch (err) {
            console.warn('Offline fallback em getStaff:', err);
            return getOfflineStaffCache(restaurantId);
        }
    },

    async addStaff(staffData) {
        const cleanPin = String(staffData.pin_code || '').trim();
        const cleanName = String(staffData.name || '').trim();
        const cleanEmail = staffData.email ? String(staffData.email).trim().toLowerCase() : null;

        // 1. Verificar duplicação de PIN ou Nome no mesmo restaurante antes de gravar
        try {
            const existingList = await this.getStaff(staffData.restaurant_id);
            const pinCollision = existingList.find(
                s => !String(s.id).startsWith('demo-') && String(s.pin_code || '').trim() === cleanPin
            );
            if (pinCollision) {
                return {
                    data: null,
                    error: new Error(`O PIN ${cleanPin} já está atribuído a "${pinCollision.name}". Cada membro da equipa deve ter um PIN exclusivo.`)
                };
            }
            if (cleanEmail) {
                const emailCollision = existingList.find(
                    s => !String(s.id).startsWith('demo-') && String(s.email || '').trim().toLowerCase() === cleanEmail
                );
                if (emailCollision) {
                    return {
                        data: null,
                        error: new Error(`O e-mail/utilizador "${cleanEmail}" já está atribuído a "${emailCollision.name}".`)
                    };
                }
            }
        } catch (checkErr) {
            console.warn('Aviso ao verificar duplicação de staff:', checkErr);
        }

        try {
            const payload = {
                restaurant_id: staffData.restaurant_id,
                name: cleanName,
                role: staffData.role || 'waiter',
                pin_code: cleanPin,
                email: cleanEmail,
                active: true
            };

            const { data, error } = await supabase
                .from('staff_members')
                .insert([payload])
                .select();

            if (error) return { data: null, error };

            const created = data?.[0] || { id: `local-${Date.now()}`, ...payload };
            const currentCache = getOfflineStaffCache(staffData.restaurant_id).filter(s => !String(s.id).startsWith('demo-'));
            saveOfflineStaffCache(staffData.restaurant_id, [...currentCache, created]);
            return { data: created, error: null };
        } catch (err) {
            // Fallback offline se estiver sem internet
            const offlineCreated = {
                id: `local-${Date.now()}`,
                restaurant_id: staffData.restaurant_id,
                name: cleanName,
                role: staffData.role || 'waiter',
                pin_code: cleanPin,
                email: cleanEmail,
                active: true
            };
            const currentCache = getOfflineStaffCache(staffData.restaurant_id);
            saveOfflineStaffCache(staffData.restaurant_id, [...currentCache, offlineCreated]);
            return { data: offlineCreated, error: null };
        }
    },

    async updateStaff(id, updates) {
        const { data, error } = await supabase
            .from('staff_members')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async deleteStaff(id, restaurantId) {
        try {
            if (!String(id).startsWith('local-') && !String(id).startsWith('demo-')) {
                const { error } = await supabase
                    .from('staff_members')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
            }
            if (restaurantId) {
                const updated = getOfflineStaffCache(restaurantId).filter(s => s.id !== id);
                saveOfflineStaffCache(restaurantId, updated);
            }
            return true;
        } catch (err) {
            if (restaurantId) {
                const updated = getOfflineStaffCache(restaurantId).filter(s => s.id !== id);
                saveOfflineStaffCache(restaurantId, updated);
            }
            return true;
        }
    },

    async getStaffRecordForUser(restaurantId, userId) {
        const { data, error } = await supabase
            .from('staff_members')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    /**
     * Valida o acesso de um colaborador combinando a identificação do operador (staffId ou Nome/Email) + PIN.
     * Evita colisões caso existam dois operadores com o mesmo PIN antigo e funciona 100% Offline!
     */
    async validatePin(restaurantId, pinCode, operatorIdentifier = null) {
        if (!restaurantId || !pinCode) return { valid: false, message: 'Selecione o operador e insira o PIN.' };
        const cleanPin = String(pinCode).trim();
        const cleanIdentifier = operatorIdentifier ? String(operatorIdentifier).trim().toLowerCase() : null;

        try {
            let candidates = [];
            if (navigator.onLine) {
                const { data, error } = await supabase
                    .from('staff_members')
                    .select('*')
                    .eq('restaurant_id', restaurantId)
                    .eq('active', true);

                if (!error && data && data.length > 0) {
                    const complete = ensureCompleteOperationalTeam(data);
                    saveOfflineStaffCache(restaurantId, complete);
                    candidates = complete;
                } else {
                    candidates = getOfflineStaffCache(restaurantId);
                }
            } else {
                candidates = getOfflineStaffCache(restaurantId);
            }

            // Filtrar pelo identificador do colaborador (ID exato, E-mail ou Nome)
            if (cleanIdentifier) {
                const byIdOrIdent = candidates.filter(s =>
                    String(s.id).toLowerCase() === cleanIdentifier ||
                    String(s.email || '').toLowerCase() === cleanIdentifier ||
                    String(s.name || '').toLowerCase() === cleanIdentifier ||
                    String(s.name || '').toLowerCase().includes(cleanIdentifier)
                );
                if (byIdOrIdent.length === 0) {
                    return { valid: false, message: 'Colaborador não encontrado nesta equipa.' };
                }
                const matched = byIdOrIdent.find(s => String(s.pin_code || '').trim() === cleanPin);
                if (!matched) {
                    return { valid: false, message: 'PIN incorreto para o colaborador selecionado.' };
                }
                return { valid: true, staff: { ...matched, role: normalizeStaffRole(matched.role) } };
            }

            // Caso não tenha sido passado identificador, procurar pelo PIN
            const pinMatches = candidates.filter(s => String(s.pin_code || '').trim() === cleanPin);
            if (pinMatches.length === 0) {
                return { valid: false, message: 'PIN incorreto ou colaborador inativo.' };
            }
            if (pinMatches.length > 1) {
                return {
                    valid: false,
                    multipleMatches: pinMatches,
                    message: 'Mais de um colaborador utiliza este PIN. Por favor, selecione primeiro o seu Nome na lista.'
                };
            }

            return { valid: true, staff: { ...pinMatches[0], role: normalizeStaffRole(pinMatches[0].role) } };
        } catch (error) {
            console.error('Staff validation error:', error);
            return { valid: false, message: 'Erro ao validar credenciais do colaborador.' };
        }
    },

    async validatePinGlobal(pinCode, operatorIdentifier = null) {
        if (!pinCode) return { valid: false, message: 'Insira o PIN de operador' };
        const cleanPin = String(pinCode).trim();
        const cleanIdent = operatorIdentifier ? String(operatorIdentifier).trim().toLowerCase() : null;

        try {
            let query = supabase
                .from('staff_members')
                .select('*, restaurants:restaurant_id(id, name, slug, business_sector)')
                .eq('pin_code', cleanPin)
                .eq('active', true);

            const { data, error } = await query;

            if (error || !data || data.length === 0) {
                return { valid: false, message: 'Credenciais de operador não encontradas.' };
            }

            let filtered = data;
            if (cleanIdent) {
                filtered = data.filter(s =>
                    String(s.email || '').toLowerCase() === cleanIdent ||
                    String(s.name || '').toLowerCase() === cleanIdent ||
                    String(s.name || '').toLowerCase().includes(cleanIdent)
                );
                if (filtered.length === 0) {
                    return { valid: false, message: 'O Nome/E-mail do operador não corresponde a este PIN.' };
                }
            }

            if (filtered.length === 1) {
                return { valid: true, staff: filtered[0], restaurant: filtered[0].restaurants };
            }

            return { valid: true, matches: filtered, multiple: true };
        } catch (error) {
            console.error('Global staff PIN validation error:', error);
            return { valid: false, message: 'Erro ao validar o acesso do operador.' };
        }
    }
};
