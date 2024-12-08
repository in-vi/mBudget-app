const webAppUrl = "https://script.google.com/macros/s/AKfycbxaXE-fAQnhdqxnwA6Mgopdz40LoMtvPl-ubhtJwresDIPp4W2y_Vtfc1VDF620QTMsuA/exec";

// Switch between tabs
function switchTab(tabName) {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => tab.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));

  document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}Tab`).classList.add('active');
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

// Load data for the selected month
function loadData() {
  const selectedMonth = document.getElementById("monthSelector").value;
  fetchData(selectedMonth);
}

// Fetch data from the Google Apps Script
function fetchData(month) {
  fetch(`${webAppUrl}?month=${encodeURIComponent(month)}`, { method: 'GET', mode: 'cors' })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      renderData(data, month);
    })
    .catch(error => {
      showMessage(`Error fetching data: ${error.message}`, "error");
    });
}

// Render fetched data to a table
function renderData(data, month) {
  const outputDiv = document.getElementById("output");
  outputDiv.innerHTML = "";

  const table = document.createElement("table");
  const headerRow = document.createElement("tr");
  ["Expense", "Actuals"].forEach(heading => {
    const th = document.createElement("th");
    th.textContent = heading;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  let totalActuals = 0;
  const categories = new Set();

  data.forEach(row => {
    const [expenseName, , actuals] = row;

    if (!expenseName || expenseName === "TOTAL") return;

    const tr = document.createElement("tr");
    [expenseName, actuals].forEach(value => {
      const td = document.createElement("td");
      td.textContent = typeof value === "number" ? Number(value).toLocaleString() : value;
      tr.appendChild(td);
    });
    table.appendChild(tr);

    if (typeof actuals === "number") totalActuals += actuals;
    categories.add(expenseName);
  });

  outputDiv.appendChild(table);

  const totalSummaryDiv = document.getElementById("totalSummary");
  totalSummaryDiv.innerHTML = `
    <h3>Total Expenses for ${month}</h3>
    <p><strong>${Number(totalActuals).toLocaleString()}</strong></p>
  `;

  populateCategories(categories);
}

// Populate categories in the form dropdown
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

// Handle form submission for adding a new entry
document.getElementById("addEntryForm").addEventListener("submit", function(event) {
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData)
  })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      if (data.error) {
        showMessage(data.error, "error");
        return;
      }
      showMessage("Data submitted successfully!", "success");
      document.getElementById("amount").value = "";
      loadData();
    })
    .catch(error => {
      showMessage(`Error submitting data: ${error.message}`, "error");
    });
});

// Show status messages
function showMessage(message, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = message;
  messageDiv.className = `status ${type}`;
  messageDiv.style.display = "block";

  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 3000);
}

// Initialize the app
window.onload = () => {
  populateMonths();
  loadData();
};
