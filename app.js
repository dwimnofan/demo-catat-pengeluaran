    (function() {
      const STORAGE_KEY = 'catatPengeluaranData';

      // Format Rupiah
      function formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount);
      }

      // Get today's date string (YYYY-MM-DD) in local timezone
      function getTodayString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      // Get current month string (YYYY-MM) in local timezone
      function getThisMonthString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      }

      // Format month for display
      function formatDisplayMonth() {
        const now = new Date();
        return now.toLocaleDateString('id-ID', {
          month: 'long',
          year: 'numeric'
        });
      }

      // Load all expenses from localStorage
      function loadExpenses() {
        try {
          const data = localStorage.getItem(STORAGE_KEY);
          return data ? JSON.parse(data) : [];
        } catch (e) {
          console.error('Error loading data:', e);
          return [];
        }
      }

      // Save all expenses to localStorage
      function saveExpenses(expenses) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
      }

      // Get this month's expenses
      function getThisMonthExpenses() {
        const month = getThisMonthString();
        return loadExpenses().filter(function(item) {
          return item.date && item.date.indexOf(month) === 0;
        });
      }

      // Render the app
      function render() {
        const monthExpenses = getThisMonthExpenses();
        // Sort by createdAt descending (newest first)
        monthExpenses.sort(function(a, b) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Update month display
        document.getElementById('monthInfo').textContent = formatDisplayMonth();

        // Calculate total
        const total = monthExpenses.reduce(function(sum, item) {
          return sum + Number(item.amount);
        }, 0);
        document.getElementById('totalThisMonth').textContent = formatRupiah(total);

        // Update count
        const countText = monthExpenses.length === 1 ? '1 item' : monthExpenses.length + ' item';
        document.getElementById('itemCount').textContent = countText;

        // Render category summary
        const categorySummaryEl = document.getElementById('categorySummary');
        if (monthExpenses.length === 0) {
          categorySummaryEl.innerHTML = '<p class="category-summary-empty">Belum ada data bulan ini.</p>';
        } else {
          const totalsByCategory = {};
          monthExpenses.forEach(function(item) {
            const category = item.category || 'Lainnya';
            totalsByCategory[category] = (totalsByCategory[category] || 0) + Number(item.amount);
          });

          const categoryRows = Object.keys(totalsByCategory).map(function(category) {
            return { category: category, amount: totalsByCategory[category] };
          }).sort(function(a, b) {
            return b.amount - a.amount;
          });

          categorySummaryEl.innerHTML = '<div class="category-summary-list">' + categoryRows.map(function(row) {
            const percent = total > 0 ? (row.amount / total * 100) : 0;
            const percentText = percent.toLocaleString('id-ID', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 1
            }) + '%';
            return `
              <div class="category-row">
                <div class="category-row-top">
                  <div class="category-row-name">${escapeHtml(row.category)}</div>
                  <div class="category-row-values"><strong>${formatRupiah(row.amount)}</strong> · ${percentText}</div>
                </div>
                <div class="category-bar">
                  <div class="category-bar-fill" style="width: ${percent}%"></div>
                </div>
              </div>
            `;
          }).join('') + '</div>';
        }

        // Render list
        const listEl = document.getElementById('expenseList');
        
        if (monthExpenses.length === 0) {
          listEl.innerHTML = `
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="M7 15h0M2 9.5h20"></path>
              </svg>
              <p>Belum ada pengeluaran bulan ini.<br>Yuk catat pengeluaran pertamamu!</p>
            </div>
          `;
          return;
        }

        listEl.innerHTML = monthExpenses.map(function(item) {
          const noteHtml = item.note && item.note.trim() 
            ? `<div class="expense-note">${escapeHtml(item.note)}</div>`
            : `<div class="expense-note empty">Tanpa catatan</div>`;
          
          return `
            <div class="expense-item" data-id="${item.id}">
              <div class="expense-info">
                <div class="expense-top">
                  <span class="category-tag">${escapeHtml(item.category)}</span>
                </div>
                ${noteHtml}
              </div>
              <div class="expense-amount">${formatRupiah(item.amount)}</div>
              <button class="btn-delete" onclick="deleteExpense('${item.id}')" aria-label="Hapus">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          `;
        }).join('');
      }

      // Escape HTML to prevent XSS
      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      // Add new expense
      document.getElementById('expenseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amountInput = document.getElementById('amount');
        const categoryInput = document.getElementById('category');
        const noteInput = document.getElementById('note');

        const amount = parseInt(amountInput.value, 10);
        const category = categoryInput.value;
        const note = noteInput.value.trim();

        if (!amount || amount <= 0) {
          alert('Masukkan nominal yang valid!');
          return;
        }

        const newExpense = {
          id: Date.now().toString(),
          amount: amount,
          category: category,
          note: note,
          date: getTodayString(),
          createdAt: new Date().toISOString()
        };

        const expenses = loadExpenses();
        expenses.push(newExpense);
        saveExpenses(expenses);

        // Reset form
        amountInput.value = '';
        noteInput.value = '';
        categoryInput.value = 'Makan';
        amountInput.focus();

        render();
      });

      // Delete expense (global function for onclick)
      window.deleteExpense = function(id) {
        if (!confirm('Hapus pengeluaran ini?')) {
          return;
        }
        const expenses = loadExpenses().filter(function(item) {
          return item.id !== id;
        });
        saveExpenses(expenses);
        render();
      };

      // Initial render
      render();
    })();
