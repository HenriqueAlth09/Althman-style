const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com a base de dados SQLite (Cria o arquivo database.sqlite automaticamente)
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('Conectado à base de dados SQLite com sucesso!');
    }
});

// Criação da tabela de produtos e estoque
db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    promoPrice REAL,
    category TEXT NOT NULL,
    stock INTEGER NOT NULL,
    image TEXT NOT NULL
)`, (err) => {
    if (!err) {
        // Insere produtos iniciais se a tabela estiver vazia
        db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (row.count === 0) {
                const defaultProducts = [
                    ['Jaqueta Bomber Oversized Althman', 449.90, 389.90, 'Vestuário', 12, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'],
                    ['Tênis Runner Pro Tech Edition', 699.90, 0, 'Tênis', 8, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
                    ['Moletom Minimalist Black', 299.90, 249.90, 'Vestuário', 15, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'],
                    ['Camiseta Heavyweight Signature', 159.90, 0, 'Vestuário', 25, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80']
                ];
                const stmt = db.prepare("INSERT INTO products (name, price, promoPrice, category, stock, image) VALUES (?, ?, ?, ?, ?, ?)");
                defaultProducts.forEach(p => stmt.run(p));
                stmt.finalize();
                console.log('Produtos iniciais inseridos na base de dados.');
            }
        });
    }
});

// ==================== ROTAS DA API ====================

// 1. Listar todos os produtos (GET)
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 2. Cadastrar novo produto (POST)
app.post('/api/products', (req, res) => {
    const { name, price, promoPrice, category, stock, image } = req.body;
    const query = `INSERT INTO products (name, price, promoPrice, category, stock, image) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [name, price, promoPrice || 0, category, stock, image], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Produto cadastrado com sucesso!' });
    });
});

// 3. Atualizar produto ou estoque (PUT)
app.put('/api/products/:id', (req, res) => {
    const { name, price, promoPrice, category, stock, image } = req.body;
    const { id } = req.params;
    const query = `UPDATE products SET name = ?, price = ?, promoPrice = ?, category = ?, stock = ?, image = ? WHERE id = ?`;

    db.run(query, [name, price, promoPrice || 0, category, stock, image, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Produto atualizado com sucesso!' });
    });
});

// 4. Deletar produto (DELETE)
app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM products WHERE id = ?`, id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Produto removido com sucesso!' });
    });
});

// 5. Atualizar estoque após a compra / checkout (POST)
app.post('/api/checkout', (req, res) => {
    const items = req.body.items; // Espera um array de { id, qty }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");

        let errorOccurred = false;
        items.forEach(item => {
            stmt.run(item.qty, item.id, item.qty, function(err) {
                if (err || this.changes === 0) {
                    errorOccurred = true;
                }
            });
        });

        stmt.finalize();

        if (errorOccurred) {
            db.run("ROLLBACK");
            res.status(400).json({ error: 'Estoque insuficiente ou erro ao processar o pedido.' });
        } else {
            db.run("COMMIT");
            res.json({ message: 'Compra realizada e estoque atualizado com sucesso!' });
        }
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Backend da Althman-style a rodar em http://localhost:${PORT}`);
});