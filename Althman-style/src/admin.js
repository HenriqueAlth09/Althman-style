import './admin.css';

document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;

    if (email === 'admin@althman.com' && pass === 'admin123') {
        localStorage.setItem('althman_style_logged', 'true');
        checkAuth();
    } else {
        alert('E-mail ou senha incorretos!');
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('althman_style_logged');
    checkAuth();
});

function checkAuth() {
    const isLogged = localStorage.getItem('althman_style_logged') === 'true';
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('admin-dashboard');

    if (isLogged) {
        if (loginScreen) loginScreen.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
        fetchAdminProducts();
    } else {
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
    }
}

async function fetchAdminProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        const products = await response.json();
        renderAdminProducts(products);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
    }
}

function renderAdminProducts(products) {
    const tbody = document.getElementById('admin-product-list');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-zinc-500">Nenhum produto cadastrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const hasPromo = p.promoPrice && p.promoPrice > 0 && p.promoPrice < p.price;
        return `
            <tr class="hover:bg-zinc-950/50">
                <td class="py-4 px-4 flex items-center gap-3">
                    <img src="${p.image}" class="w-10 h-10 object-cover bg-zinc-950 border border-zinc-800" alt="">
                    <span class="font-bold uppercase text-xs">${p.name}</span>
                </td>
                <td class="py-4 px-4 text-zinc-400 text-xs">${p.category}</td>
                <td class="py-4 px-4">
                    <span class="font-bold">R$ ${hasPromo ? p.promoPrice.toFixed(2).replace('.', ',') : p.price.toFixed(2).replace('.', ',')}</span>
                    ${hasPromo ? `<br><span class="text-xs text-red-400 line-through">R$ ${p.price.toFixed(2).replace('.', ',')} (Promo)</span>` : ''}
                </td>
                <td class="py-4 px-4"><span class="bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs font-bold">${p.stock} un.</span></td>
                <td class="py-4 px-4 text-right space-x-2">
                    <button onclick="window.editProduct(${p.id}, '${encodeURIComponent(p.name)}', ${p.price}, ${p.promoPrice}, '${p.category}', ${p.stock}, '${encodeURIComponent(p.image)}')" class="text-zinc-400 hover:text-white p-2" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="window.deleteProduct(${p.id})" class="text-zinc-500 hover:text-red-400 p-2" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const promoPrice = parseFloat(document.getElementById('prod-promo').value) || 0;
    const category = document.getElementById('prod-category').value;
    const stock = parseInt(document.getElementById('prod-stock').value);
    const image = document.getElementById('prod-image').value;

    const productData = { name, price, promoPrice, category, stock, image };

    try {
        let url = 'http://localhost:3000/api/products';
        let method = 'POST';

        if (id) {
            url = `http://localhost:3000/api/products/${id}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (!response.ok) throw new Error('Erro ao salvar produto');

        alert(id ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        resetForm();
        fetchAdminProducts();
    } catch (err) {
        alert('Erro: ' + err.message);
    }
});

window.editProduct = function(id, name, price, promoPrice, category, stock, image) {
    document.getElementById('prod-id').value = id;
    document.getElementById('prod-name').value = decodeURIComponent(name);
    document.getElementById('prod-price').value = price;
    document.getElementById('prod-promo').value = promoPrice || '';
    document.getElementById('prod-category').value = category;
    document.getElementById('prod-stock').value = stock;
    document.getElementById('prod-image').value = decodeURIComponent(image);

    document.getElementById('form-title').innerHTML = `<i class="fa-solid fa-pen text-sm"></i> Editar Produto #${id}`;
    document.getElementById('btn-save').innerText = 'Atualizar Produto';
    document.getElementById('btn-cancel').classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
    document.getElementById('prod-id').value = '';
    document.getElementById('product-form').reset();
    document.getElementById('form-title').innerHTML = `<i class="fa-solid fa-plus text-sm"></i> Cadastrar Novo Produto`;
    document.getElementById('btn-save').innerText = 'Salvar no Estoque';
    document.getElementById('btn-cancel').classList.add('hidden');
}

document.getElementById('btn-cancel').addEventListener('click', resetForm);

window.deleteProduct = async function(id) {
    if (confirm('Deseja realmente remover este produto?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Erro ao excluir');
            fetchAdminProducts();
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    }
}

checkAuth();