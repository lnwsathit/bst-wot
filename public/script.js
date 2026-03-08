// Search for work orders
async function searchWorkOrders() {
    const searchInput = document.getElementById('searchInput').value.trim();

    if (!searchInput) {
        showMessage('Please enter a search term', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/workorder/search/${encodeURIComponent(searchInput)}`);
        const data = await response.json();

        if (data.success) {
            displayResults(data.data);
        } else {
            showMessage('No results found', 'error');
        }
    } catch (err) {
        console.error('Search error:', err);
        showMessage('Error searching orders', 'error');
    }
}

// Display search results
function displayResults(workOrders) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    if (workOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">No orders found</td></tr>';
        return;
    }

    workOrders.forEach(wo => {
        const row = document.createElement('tr');
        const lastUpdate = new Date(wo.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const statusClass = `status-${wo.status.toLowerCase().replace(/\s+/g, '-')}`;

        row.innerHTML = `
            <td><strong>${wo.quotation_no}</strong></td>
            <td>${wo.customer_name}</td>
            <td><span class="status-badge ${statusClass}">${wo.status}</span></td>
            <td>${lastUpdate}</td>
            <td><button class="detail-btn" onclick="showDetail(${wo.id})">View Details</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Show detail modal
async function showDetail(id) {
    try {
        const response = await fetch(`/api/workorder/${id}`);
        const data = await response.json();

        if (data.success) {
            const wo = data.data;
            displayTimeline(wo);
            document.getElementById('detailModal').classList.add('show');
        } else {
            showMessage('Error loading order details', 'error');
        }
    } catch (err) {
        console.error('Error loading details:', err);
        showMessage('Error loading order details', 'error');
    }
}

// Display timeline
function displayTimeline(wo) {
    // Set header
    document.getElementById('detailTitle').textContent = `Order: ${wo.quotation_no}`;
    document.getElementById('detailCustomer').textContent = `Customer: ${wo.customer_name}`;

    // Build timeline items data
    const timelineSteps = [
        {
            step: 'Quotation',
            icon: '📄',
            timestamp: wo.quotation_timestamp,
            detail: wo.quotation_detail,
            file: wo.quotation_file,
            completed: wo.status !== 'Quotation' || wo.quotation_timestamp
        },
        {
            step: 'PO Customer',
            icon: '📋',
            timestamp: wo.po_customer_timestamp,
            detail: wo.po_customer_detail,
            file: wo.po_customer_file,
            completed: ['Customer PO', 'Supplier PO', 'Invoice', 'Completed'].includes(wo.status)
        },
        {
            step: 'PO Supplier',
            icon: '📦',
            timestamp: wo.po_supplier_timestamp,
            detail: wo.po_supplier_detail,
            file: wo.po_supplier_file,
            completed: ['Supplier PO', 'Invoice', 'Completed'].includes(wo.status)
        },
        {
            step: 'Invoice',
            icon: '🧾',
            timestamp: wo.invoice_timestamp,
            detail: wo.invoice_detail,
            file: wo.invoice_file,
            completed: ['Invoice', 'Completed'].includes(wo.status)
        },
        {
            step: 'Completed',
            icon: '✅',
            timestamp: wo.completed_timestamp || new Date().toISOString(),
            detail: wo.completed_detail,
            file: null,
            completed: wo.status === 'Completed'
        }
    ];

    // Build timeline HTML
    const timelineHTML = timelineSteps.map(step => {
        const timestamp = step.timestamp
            ? new Date(step.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
            : 'Not started';

        const completedClass = step.completed ? 'completed' : '';

        let fileLink = '';
        if (step.file) {
            fileLink = `<a href="/uploads/${step.file}" class="pdf-link" target="_blank">📥 View PDF</a>`;
        } else if (!step.completed) {
            fileLink = '<span class="timeline-empty">No file attached</span>';
        }

        const detail = step.detail || 'No details provided';

        return `
            <div class="timeline-item ${completedClass}">
                <div class="timeline-marker">${step.icon}</div>
                <div class="timeline-line"></div>
                <div class="timeline-content">
                    <div class="timeline-step">${step.step}</div>
                    <div class="timeline-timestamp">${timestamp}</div>
                    <div class="timeline-detail">Detail: ${detail}</div>
                    <div>${fileLink}</div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('timeline').innerHTML = timelineHTML;
}

// Close detail modal
function closeDetail() {
    document.getElementById('detailModal').classList.remove('show');
}

// Show message
function showMessage(text, type) {
    const msgEl = document.getElementById('message');
    msgEl.textContent = text;
    msgEl.className = `message ${type}`;
    setTimeout(() => {
        msgEl.className = 'message';
    }, 5000);
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('detailModal');
    if (event.target === modal) {
        modal.classList.remove('show');
    }
};

// Allow search by pressing Enter
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchWorkOrders();
            }
        });
    }
});
