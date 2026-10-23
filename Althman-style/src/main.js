import './style.css';

let cart = [];
let currentCategory = 'todos';
let productsCache = [];

async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        productsCache = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Erro ao buscar produtos do backend:', error);
        document.getElementById('product-grid').innerHTML = `<div class="col-span-full text-center py-16 text-red-500">Erro ao conectar ao servidor backend. Certifique-se de que o Node.js está rodando.</div>`;
    }
}

window.filterCategory = function(category) {
    currentCategory = category;
    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    const countEl = document.getElementById('product-count');
    
    if (!grid) return;

    let filtered = productsCache;
    if (currentCategory === 'Vestuário') {
        filtered = productsCache.filter(p => p.category === 'Vestuário');
    } else if (currentCategory === 'Tênis') {
        filtered = productsCache.filter(p => p.category === 'Tênis');
    } else if (currentCategory === 'Promoções') {
        filtered = productsCache.filter(p => p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price);
    }

    if (countEl) countEl.innerText = `Mostrando ${filtered.length} produtos`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-16 text-zinc-500">Nenhum produto encontrado nesta categoria.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const hasPromo = p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price;
        const currentPrice = hasPromo ? p.promoPrice : p.price;

        return `
            <div class="group bg-zinc-900 border border-zinc-800 rounded-none overflow-hidden flex flex-col justify-between hover:border-zinc-600 transition-all">
                <div>
                    <div class="relative h-80 overflow-hidden bg-zinc-950">
                        <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <span class="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-xs font-bold uppercase tracking-wider px-3 py-1 border border-zinc-800">${p.category}</span>
                        ${hasPromo ? `<span class="absolute top-3 right-3 bg-red-600 text-white text-xs font-black uppercase px-2.5 py-1 tracking-wider shadow-lg">Promoção</span>` : ''}
                        <span class="absolute bottom-3 right-3 bg-zinc-950/90 text-xs font-semibold px-2.5 py-1 text-zinc-300">Estoque: ${p.stock} un.</span>
                    </div>
                    <div class="p-5">
                        <h3 class="font-bold text-base uppercase tracking-tight text-white mb-2">${p.name}</h3>
                        <div class="flex items-center gap-3">
                            <p class="text-xl font-black text-zinc-100">R$ ${currentPrice.toFixed(2).replace('.', ',')}</p>
                            ${hasPromo ? `<span class="text-sm text-zinc-500 line-through">R$ ${p.price.toFixed(2).replace('.', ',')}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="p-5 pt-0">
                    <button onclick="window.addToCart(${p.id})" ${p.stock <= 0 ? 'disabled' : ''} class="w-full bg-white text-black font-bold py-3 uppercase tracking-wider hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        ${p.stock > 0 ? 'Adicionar à Sacola' : 'Esgotado'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

window.addToCart = function(id) {
    const product = productsCache.find(p => p.id === id);
    if (!product || product.stock <= 0) return;

    const effectivePrice = (product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.price) ? product.promoPrice : product.price;

    const cartItem = cart.find(item => item.id === id);
    if (cartItem) {
        if (cartItem.qty < product.stock) {
            cartItem.qty++;
        } else {
            alert('Quantidade máxima em estoque atingida!');
            return;
        }
    } else {
        cart.push({ ...product, price: effectivePrice, qty: 1 });
    }
    updateCartUI();
    window.toggleCart();
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const itemsContainer = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');

    if (!badge || !itemsContainer || !totalEl) return;

    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    if (totalCount > 0) {
        badge.innerText = totalCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    if (cart.length === 0) {
        itemsContainer.innerHTML = `<p class="text-center text-zinc-500 py-12">Sua sacola está vazia.</p>`;
        totalEl.innerText = 'R$ 0,00';
        return;
    }

    itemsContainer.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between bg-zinc-950 p-4 border border-zinc-800">
            <img src="${item.image}" class="w-16 h-16 object-cover bg-zinc-900" alt="${item.name}">
            <div class="flex-1 px-4">
                <h4 class="font-bold text-sm uppercase">${item.name}</h4>
                <p class="text-xs text-zinc-400 mt-1">R$ ${item.price.toFixed(2).replace('.', ',')} x ${item.qty}</p>
            </div>
            <button onclick="window.removeFromCart(${item.id})" class="text-zinc-500 hover:text-white p-2"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    totalEl.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

window.toggleCart = function() {
    const drawer = document.getElementById('cart-drawer');
    if (drawer) drawer.classList.toggle('hidden');
}

window.checkout = function() {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    const modalId = 'checkout-modal';
    let existingModal = document.getElementById(modalId);
    if (existingModal) existingModal.remove();

    const modalHTML = `
        <div id="${modalId}" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-zinc-900 border border-zinc-800 max-w-md w-full p-6 shadow-2xl space-y-6">
                <div class="flex justify-between items-center border-b border-zinc-800 pb-4">
                    <h3 class="font-black text-lg uppercase tracking-wider">Finalizar Pagamento</h3>
                    <button onclick="document.getElementById('${modalId}').remove()" class="text-zinc-400 hover:text-white"><i class="fa-solid fa-xmark text-xl"></i></button>
                </div>
                <div>
                    <p class="text-xs text-zinc-400 uppercase tracking-widest">Total do Pedido</p>
                    <p class="text-2xl font-black text-white mt-1">R$ ${total.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="space-y-3">
                    <label class="block text-xs font-bold uppercase tracking-wider text-zinc-400">Escolha a Forma de Pagamento</label>
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="window.selectPayment('pix')" id="pay-pix" class="py-3 px-2 border border-zinc-700 bg-zinc-950 text-xs font-bold uppercase tracking-wider hover:border-white transition-all text-center">PIX</button>
                        <button type="button" onclick="window.selectPayment('card')" id="pay-card" class="py-3 px-2 border border-zinc-700 bg-zinc-950 text-xs font-bold uppercase tracking-wider hover:border-white transition-all text-center">Cartão</button>
                        <button type="button" onclick="window.selectPayment('boleto')" id="pay-boleto" class="py-3 px-2 border border-zinc-700 bg-zinc-950 text-xs font-bold uppercase tracking-wider hover:border-white transition-all text-center">Boleto</button>
                    </div>
                </div>
                <div id="payment-details" class="bg-zinc-950 p-4 border border-zinc-800 text-xs text-zinc-400">
                    Selecione uma forma de pagamento acima para prosseguir.
                </div>
                <button onclick="window.confirmOrder()" class="w-full bg-white text-black font-bold py-4 uppercase tracking-wider hover:bg-zinc-200 transition-colors">Confirmar Pagamento</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    window.selectedPaymentMethod = null;
}

window.selectPayment = function(method) {
    window.selectedPaymentMethod = method;
    const details = document.getElementById('payment-details');
    
    ['pix', 'card', 'boleto'].forEach(m => {
        const btn = document.getElementById(`pay-${m}`);
        if(btn) btn.classList.remove('border-white', 'bg-zinc-800');
    });
    document.getElementById(`pay-${method}`).classList.add('border-white', 'bg-zinc-800');

    if (method === 'pix') {
        details.innerHTML = `<p class="font-bold text-white mb-1">PIX Selecionado</p><p>Aprovação imediata após a confirmação.</p>`;
    } else if (method === 'card') {
        details.innerHTML = `<p class="font-bold text-white mb-1">Cartão de Crédito</p><input type="text" placeholder="Número do Cartão" class="w-full mt-2 bg-zinc-900 border border-zinc-700 p-2 text-white text-xs">`;
    } else if (method === 'boleto') {
        details.innerHTML = `<p class="font-bold text-white mb-1">Boleto Bancário</p><p>Compensação em até 2 dias úteis.</p>`;
    }
}

window.confirmOrder = async function() {
    if (!window.selectedPaymentMethod) {
        alert('Por favor, selecione uma forma de pagamento!');
        return;
    }

    try {
        const itemsToCheckout = cart.map(item => ({ id: item.id, qty: item.qty }));
        
        const response = await fetch('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: itemsToCheckout })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Erro ao processar checkout');

        alert('Pagamento aprovado! Estoque atualizado no banco de dados.');
        
        const modal = document.getElementById('checkout-modal');
        if (modal) modal.remove();
        
        cart = [];
        updateCartUI();
        window.toggleCart();
        fetchProducts();
    } catch (err) {
        alert('Erro: ' + err.message);
    }
}

fetchProducts();