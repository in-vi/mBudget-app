const webAppUrl = "https://script.google.com/macros/s/AKfycbxaXE-fAQnhdqxnwA6Mgopdz40LoMtvPl-ubhtJwresDIPp4W2y_Vtfc1VDF620QTMsuA/exec";

// Switch between tabs
function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => tab.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));

  if (tabName === 'home') {
    document.querySelector('.tab:nth-child(1)').classList.add('active');
    document.getElementById('homeTab').classList.add('active');
  } else if (tabName === 'summary') {
    document.querySelector('.tab:nth-child(2)').classList.add('active');
    document.getElementById('summaryTab').classList.add('active');
  }
}

// Populate the month dropdown
function populateMonths() {
  const monthSelector = document.getElementById("monthSelector");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentMonthIndex = new Date().getMonth();
  months.forEach((month, index) => {
    const option = document.createElement("option");
    option.value = month;
    option.textContent = month;
    if (index === currentMonthIndex) {
      option.selected = true;
    }
    monthSelector.appendChild(option);
  });
}

// Select category from quick select buttons
function selectCategory(category) {
  const categorySelect = document.getElementById("category");
  categorySelect.value = category;
}

// Populate categories from the fetched data
function populateCategories(categories) {
  const categorySelect = document.getElementById("category");
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Toggle table visibility
function toggleTable() {
  const table = document.querySelector('table');
  const toggleBtn = document.querySelector('.toggle-table-btn');

  if (table.style.display === 'table') {
    table.style.display = 'none';
    toggleBtn.textContent = 'Show Expenses';
  } else {
    table.style.display = 'table';
    toggleBtn.textContent = 'Hide Expenses';
  }
}

// Load data for the selected month
function loadData() {
  const selectedMonth = document.getElementById("monthSelector").value;
  fetchData(selectedMonth);
}

function calculateTotal(data) {
  let total = 0;

  data.forEach(row => {
    const [expenseName, , actuals] = row;

    if (!expenseName || expenseName === "TOTAL" || actuals <= 0) {
      return;
    }

    total += actuals;
  });

  return total;
}


// Fetch data from the Google Apps Script
function fetchData(month) {
  fetch(`${webAppUrl}?month=${encodeURIComponent(month)}`, { method: 'GET', mode: 'cors' })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      const outputDiv = document.getElementById("output");
      outputDiv.innerHTML = "";

      if (data.error) {
        showMessage("Error fetching data: " + data.error, "error");
        return;
      }

      // Show the "data loaded successfully" message from A1 if available
      const successMessage = data.message || "Data loaded successfully"; // Change this if Apps Script returns the message.
      outputDiv.innerHTML = `<h3>${successMessage}</h3>`;

      const table = document.createElement("table");
      const headerRow = document.createElement("tr");
      ["Expense", "Actuals"].forEach(heading => {
        const th = document.createElement("th");
        th.textContent = heading;
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      let totalActuals = calculateTotal(data);

      const categories = new Set();
      data.forEach(row => {
        const [expenseName, , actuals] = row;

        if (!expenseName || expenseName === "Total" || actuals <= 0) {
          return;
        }

        const tr = document.createElement("tr");
        [expenseName, actuals].forEach(value => {
          const td = document.createElement("td");
          td.textContent = typeof value === "number" ? Number(value).toLocaleString() : value;
          tr.appendChild(td);
        });
        table.appendChild(tr);

        categories.add(expenseName);
      });

      outputDiv.appendChild(table);

      const totalSummaryDiv = document.getElementById("totalSummary");
      totalSummaryDiv.innerHTML = `
        <h3>Total Expenses for ${month}</h3>
        <p><strong>${Number(totalActuals).toLocaleString()}</strong></p>
      `;

      populateCategories(categories);
      switchTab('summary');
    })
    .catch(error => {
      showMessage("Error fetching data: " + error.message, "error");
    });
}


// Submit new expense
function submitExpense(event) {
  event.preventDefault();

  const category = document.getElementById("category").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const month = document.getElementById("monthSelector").value;

  if (!category || isNaN(amount)) {
    showMessage("Please select a category and enter a valid amount.", "error");
    return;
  }

  const formData = { category, amount, month };

  fetch(webAppUrl, {
    method: "POST",
    mode: 'cors',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.status === "error") {
        showMessage(data.message, "error");
        return;
      }
      showMessage("Expense added successfully!", "success");
      document.getElementById("amount").value = "";
      loadData();
    })
    .catch(error => {
      showMessage("Error submitting expense: " + error.message, "error");
    });
}
// Add amount to "internet"
function addAmountToInternet() {
  const amount = parseFloat(document.getElementById("amount").value);

  if (isNaN(amount) || amount <= 0) {
    showMessage("Please enter a valid amount to add.", "error");
    return;
  }

  const month = document.getElementById("monthSelector").value;

  const url = `${webAppUrl}?action=addAmount&amount=${encodeURIComponent(amount)}&month=${encodeURIComponent(month)}`;

  fetch(url, { method: 'GET', mode: 'cors' })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showMessage(data.error, "error");
      } else {
        showMessage(data.message, "success");
        loadData(); // Reload the data to reflect the change
      }
    })
    .catch(error => {
      showMessage("Error adding amount: " + error.message, "error");
    });
}

// Show status message
function showMessage(message, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = message;
  messageDiv.className = `status ${type}`;
  messageDiv.style.display = "block";

  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Add event listener to form submission
  document.getElementById("addEntryForm").addEventListener("submit", submitExpense);

  // Populate months and load initial data
  populateMonths();
  loadData();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log("Service Worker Registered"))
      .catch(err => console.error("Service Worker Registration Failed:", err));
  });
}
