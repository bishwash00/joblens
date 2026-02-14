# 🔍 JobLens

**JobLens** is a data-driven web application that analyzes global job listings to help users understand **job demand**, **salary trends**, and **career opportunities across countries**. It is designed for developers and professionals planning international careers, with a strong focus on analytics rather than job applications.

---

## 🚀 Live Demo

> https://joblens-ashen.vercel.app/

---

## 🎯 Project Goal

The goal of JobLens is to provide clear answers to questions like:

- Where is my job role most in demand?
- Which countries offer better salaries for my role?
- How do salaries compare after currency conversion?
- Which countries should I target for my career?

JobLens focuses on **insights**, not applications.

---

## 🧠 Key Features

### 🔍 Job Search

- Search jobs by role (e.g. _Frontend Developer_, _Backend Engineer_)
- Fetch real job listings from multiple countries
- Debounced search input for performance

### 📄 Job Listings

- Paginated job results
- Sort by salary, country, or relevance
- Clean, readable job cards

### 💰 Salary Analysis

- Extract salary data from job listings
- Calculate average salary per country
- Convert salaries into user-selected currency

### 🌍 Demand Analysis

- Analyze job demand by country
- Rank countries based on number of listings
- Identify top markets for specific roles

### ⭐ Bookmarks

- Save job listings or career targets
- Persist bookmarks using LocalStorage
- Restore saved data on reload

### 📊 Analytics Dashboard

- Visual comparison of demand and salary data
- Clear separation between raw listings and insights

---

## 🧩 APIs Used

- **Job Listings:** Adzuna Jobs API
- **Currency Conversion:** ExchangeRate.host
- **Country Metadata:** REST Countries API (optional)

_All APIs used are free-tier friendly._

---

## 🏗️ Architecture

JobLens follows the **MVC (Model–View–Controller)** architecture as taught in Jonas Schmedtmann’s JavaScript course.

```
src/
 ├─ js/
 │   ├─ model.js
 │   ├─ controller.js
 │   ├─ helpers.js
 │   ├─ config.js
 │   └─ views/
 │        ├─ searchView.js
 │        ├─ resultsView.js
 │        ├─ jobView.js
 │        ├─ chartView.js
 │        └─ bookmarksView.js
```

### State Design

```js
state = {
  search: {
    query: '',
    results: [],
    page: 1,
    resultsPerPage: 10,
  },
  job: {},
  analytics: {
    demandByCountry: {},
    avgSalaryByCountry: {},
  },
  currency: {
    base: 'USD',
    target: 'USD',
    rate: 1,
  },
  bookmarks: [],
};
```

---

## 🛠️ Technologies Used

- Vanilla JavaScript (ES6+)
- HTML5 & SCSS
- REST APIs
- MVC architecture
- LocalStorage

_No frameworks used._

---

## 🧠 JavaScript Concepts Demonstrated

- Async / Await & API orchestration
- Debounce & closures
- State management
- Array methods (`map`, `reduce`, `sort`)
- Data normalization
- Currency conversion
- Error handling
- Persistent storage

---

## ⚠️ Challenges Solved

- Normalizing inconsistent salary data
- Handling missing or partial API responses
- Aggregating job demand across countries
- Converting and formatting currencies accurately
- Maintaining clean separation of concerns

---

## 📌 Future Improvements

- Skill-based demand analysis
- Experience-level salary comparison
- Role-to-country recommendations
- Export career targets
- Historical trend tracking

---

## 👤 Author

Built by **Bishwash Karki**

---

## 📄 License

This project is for educational and portfolio purposes.
