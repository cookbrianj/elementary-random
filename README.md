# Elementary Random Student Placement Dashboard
### Neosho School District | Wildcat Pride

An interactive, web-based tool for equitably distributing students into elementary classrooms based on demographic parity, academic needs, and class capacity.

![Neosho Colors](https://img.shields.io/badge/Theme-Neosho%20Wildcats-C5B358?style=flat-square&labelColor=0c0c0c)
![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=flat-square&logo=vite)

---

## 🌟 Overview

This application automates the complex process of building balanced elementary classrooms. By ingesting student demographic data and class capacities via CSV (or PowerSchool JSON), it uses a multi-pass balancing algorithm to ensure every teacher receives a diverse and equitable group of students.

### Key Logic & Features
- **Equitable Balancing**: Prioritizes the distribution of students with IEP and MLL statuses across all available sections.
- **Gender Parity**: Analyzes student rosters to maintain an even split of male and female students per teacher.
- **Interactive Editor**: Includes a fully interactive **Drag & Drop** interface, allowing administrators to manually fine-tune placement with real-time demographic updates.
- **Dynamic Capacity**: Click on class capacity badges to override section limits on the fly.
- **Clipboard Utility**: One-click "Copy Student Numbers" for quick data transfer into PowerSchool or other SIS tools.
- **District Branding**: Native dark-mode theme utilizing Neosho SD’s official **Black** and **Vegas Gold** palette.

---

## 📂 Project Structure

```text
elementary_random/
├── src/
│   ├── components/
│   │   ├── FileUpload.vue             # Handles CSV ingestion & header normalization
│   │   └── ClassDemographicsChart.vue  # Interactive DND cards with Chart.js visualization
│   ├── utils/
│   │   └── balancer.js                # Core Fisher-Yates shuffle & balancing algorithm
│   ├── App.vue                        # Main reactive state orchestration
│   ├── main.js                        # Vue initialization
│   └── style.css                      # Global Neosho dark-mode design system
├── generate_samples.cjs               # Utility to create test CSV data
├── index.html                         # Entry point
├── package.json                       # Dependencies (Chart.js, PapaParse, Vue)
└── vite.config.js                     # Optimized build configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed on your machine.

### 2. Installation
```bash
npm install
```

### 3. Local Development
Run the development server to launch the dashboard locally.
```bash
npm run dev
```

### 4. Running the Algorithm
1. Upload your `Students.csv` (required columns: `student_number`, `student_name` (or `name`), `grade_level`, `gender`, `iep`, `mll`).
2. Upload your `Classes.csv` (required columns: `teacher_name`, `section_number`, `grade_level`, `max_students`).
3. Select the target **Grade Level** from the dropdown.
4. Click **Balance Classes**.

---

## 📑 CSV File Specifications

### Student File
| Column | Description | Format |
| :--- | :--- | :--- |
| `student_number` | Unique ID | String/Int |
| `student_name` | Full name | String |
| `grade_level` | Int (e.g. 2) | Int |
| `gender` | Male/Female | `m` or `f` |
| `iep` | Special Ed status | `1`/`0`, `true`/`false`, `y`/`n` |
| `mll` | Language Learner | `1`/`0`, `true`/`false`, `y`/`n` |

### Class File
| Column | Description | Format |
| :--- | :--- | :--- |
| `teacher_name` | Name of teacher | String |
| `section_number` | Unique section ID | String/Int |
| `grade_level` | Target grade | Int |
| `max_students` | Capacity limit | Int |

---

## 🛠 PowerSchool Integration (Future)
This project is architected for easy migration to a PowerSchool Plugin. Future iterations will replace the `FileUpload` component with a live `fetch` call to a PowerSchool `~[tlist_sql]` endpoint, enabling real-time placements directly within the SIS.

---

*Developed for Neosho School District. Go Wildcats!*
