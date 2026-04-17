# Elementary Student Placement Dashboard
### Neosho School District 

An administrative-grade, web-based tool for equitably distributing students into elementary classrooms. This dashboard balances demographic parity, academic needs, and class capacity across multiple grade levels simultaneously.

![Neosho Colors](https://img.shields.io/badge/Theme-Neosho%20Wildcats-C5B358?style=flat-square&labelColor=0c0c0c)
![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=flat-square&logo=vite)
![Deployment](https://img.shields.io/badge/Deploy-GitHub%20Pages-222222?style=flat-square&logo=github)

---

## 🌟 Core Features

### 1. Intelligent Balancing Algorithm
*   **Weighted Parity**: prioritizes the distribution of students with IEP and MLL statuses across all available sections first.
*   **Gender Balance**: Automatically maintains an even split of male and female students per classroom.
*   **Randomized Residuals**: Fairly distributes "remainder" students so that classrooms with slightly higher counts are chosen randomly rather than alphabetically.

### 2. Multi-Grade Persistence
*   **Session Switching**: Jump between grade levels (e.g., Grade 2 to Grade 3) without losing progress.
*   **Master Store**: The application maintains the state for the entire school building in a single session.

### 3. Comprehensive Placement Controls
*   **Manual Override**: Add classrooms manually via the "Add Teacher" form to handle last-minute hiring or section splits.
*   **Course & Section Tracking**: Full support for `course_number` and `section_number` identifiers (formatted as `course.section`).
*   **Master Roster**: A searchable, sortable global table for high-level student management.

### 4. Interactive Adjustments
*   **Drag & Drop**: Manually move students between rosters with real-time demographic chart updates.
*   **Persistent Locking**: "Lock" students to specific teachers to ensure they are never moved by the algorithm or accidental drags.

---

## 💾 Session Management

*   **Scenario Exports**: Save your entire school's placement state as a portable `.json` scenario file.
*   **Resume Session**: Instantly restore a previous scenario by uploading the saved project file.
*   **Auto-Save Fail-safe**: Continuously persists changes to `localStorage` to prevent data loss due to accidental refreshes or browser crashes.

---

## 📑 File Specifications

### Student CSV Data (`students.csv`)
| Header | Description | Required | Options |
| :--- | :--- | :--- | :--- |
| `student_number` | Unique ID | Yes | - |
| `student_name` | Name (Last, First) | Yes | - |
| `grade_level` | Grade Level | Yes | - |
| `gender` | Student Gender | Yes | M, F |
| `iep` | IEP Status | Yes | 1/0, Y/N, True/False |
| `mll` | Language Learner | Yes | 1/0, Y/N, True/False |

### Class CSV Data (`classes.csv`)
| Header | Description | Required | Options |
| :--- | :--- | :--- | :--- |
| `course_number` | Course Code | Yes | e.g. 101 |
| `teacher_name` | Card Display Name | Yes | - |
| `grade_level` | Grade Level | Yes | - |
| `max_students` | Class Capacity | Yes | - |
| `section_number` | Section Code | Yes | e.g. 201 |

---

## 📂 Project Structure

```text
elementary_random/
├── src/
│   ├── components/
│   │   ├── AddTeacherForm.vue         # Manual classroom insertion
│   │   ├── MasterRoster.vue           # Global searchable student table
│   │   ├── ClassDemographicsChart.vue  # Interactive DND cards
│   │   ├── HelpView.vue               # Integrated documentation
│   │   └── FileUpload.vue             # CSV ingestion
│   ├── utils/
│   │   └── balancer.js                # Core balancing logic
│   └── style.css                      # Neosho Design System
```

---

## 🚀 Getting Started

1. **Prerequisites**: Node.js (v18+) and npm.
2. **Install**: `npm install`
3. **Run**: `npm run dev`
4. **Deploy**: Automated via GitHub Actions (pushes to `main` go live to GitHub Pages).

*Developed for Neosho School District.*
