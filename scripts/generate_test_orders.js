const db = require('../config/database');

async function generate() {
    const statuses = ['Quotation', 'Customer PO', 'Supplier PO', 'Invoice', 'Completed'];
    const start = 26003;
    const end = 26503;
    for (let i = start; i <= end; i++) {
        const quotationNo = `QT${i}`;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');
        try {
            await db.execute(
                `INSERT INTO work_orders (customer_name, quotation_no, quotation_detail, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [`Customer ${i}`, quotationNo, `Detail for ${quotationNo}`, status, timestamp, timestamp]
            );
            console.log(`Inserted ${quotationNo} with status ${status}`);
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') continue;
            console.error('Error inserting', quotationNo, err);
        }
    }
    process.exit(0);
}

generate();