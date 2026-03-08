import React from 'react';

const TableBillTemplate = React.forwardRef(({ order, restaurantName }, ref) => {
    if (!order) return null;

    return (
        <div ref={ref} className="bg-white text-black p-4 w-[300px] text-xs font-mono" style={{ margin: '0 auto', color: '#000', backgroundColor: '#fff' }}>
            {/* Header */}
            <div className="text-center mb-4 border-b border-black pb-2">
                <h2 className="text-lg font-bold uppercase">{restaurantName || 'Jindungo'}</h2>
                <p>Conta de Conferência</p>
                <p>Mesa: {order.table_number.replace('Entrega: ', '')}</p>
                <p>Data: {new Date(order.created_at || Date.now()).toLocaleString('pt-AO')}</p>
                {order.customer_name && <p>Cliente: {order.customer_name}</p>}
            </div>

            {/* Items */}
            <div className="mb-4">
                <div className="flex justify-between border-b border-black pb-1 mb-2 font-bold">
                    <span>Qtd Item</span>
                    <span>Preço</span>
                </div>
                {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between mb-1">
                        <span className="flex-1 pr-2">
                            {item.quantity}x {item.name}
                        </span>
                        <span className="whitespace-nowrap">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price * item.quantity).replace('AOA', '')}
                        </span>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="border-t border-black pt-2 mb-4">
                <div className="flex justify-between text-base font-bold">
                    <span>TOTAL</span>
                    <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.total).replace('AOA', 'Kz')}</span>
                </div>
                <div className="flex justify-between mt-1 text-[10px]">
                    <span>Método Pgto:</span>
                    <span>{order.payment_method === 'multicaixa' ? 'Multicaixa' : order.payment_method === 'cash' ? 'Dinheiro' : (order.payment_method || 'Não inf.')}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] mt-6 pt-2 border-t border-black border-dashed">
                <p className="font-bold uppercase tracking-wider mb-1">Este documento não serve de Fatura</p>
                <p>Sem Valor Fiscal</p>
                <p className="mt-2 text-[8px]">Powered by Jindungo</p>
            </div>
        </div>
    );
});

TableBillTemplate.displayName = 'TableBillTemplate';

export default TableBillTemplate;
