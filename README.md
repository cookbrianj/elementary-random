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
*   **Multi-Step Distribution**: Prioritizes specialized needs (IEP/MLL) before filling with general population.
*   **Least-Filled-First Compensation**: Automatically balances total class counts by placing regular students into classes that received fewer specialized students.
*   **Gender Parity**: Maintains even gender splits across all sections.
*   **Conflict Enforcement**: Respects student "avoids" pairs and hard demographic caps (`max_iep`, `max_mll`).

---

## 🧮 Balancing Algorithm Details

The dashboard uses a multi-pass placement algorithm designed to achieve equitable distribution while respecting hard constraints.

### 1. Pre-Processing & Locking
Before any automated placement occurs, the algorithm:
*   Identifies all **Locked Students** (pinned to specific teachers) and places them first.
*   Checks if these manual placements violate any hard caps (`max_iep` or `max_mll`) and alerts the user if conflicts exist.

### 2. Prioritized Student Pools
Remaining students are sorted into four distinct pools to ensure high-needs students are spread across classrooms before the general population is added:
1.  **IEP & MLL**: Students with both statuses (Highest priority).
2.  **IEP Only**: Students with IEP status.
3.  **MLL Only**: Students with MLL status.
4.  **Regular**: Students with no special demographic flags.

### 3. Distribution Strategies
The algorithm uses two different strategies depending on the pool:

#### Specialized Pools (Round-Robin)
For the IEP and MLL pools, the algorithm uses a **Round-Robin** approach. It iterates through all available classes, placing one student at a time into classes that have not reached their specific `max_iep` or `max_mll` limits. This ensures that even if only two teachers are eligible to take IEP students, those students are split 50/50 between them.

#### Regular Pool (Least-Filled-First)
To keep total class sizes balanced, the regular student pool uses a **Least-Filled-First** strategy. For every regular student:
1.  The algorithm calculates the **fill ratio** (`currentCount / targetMax`) for every eligible classroom.
2.  The student is placed in the classroom with the lowest ratio.
3.  This naturally compensates for classes that received more students during the specialized passes, ensuring that final class totals are as even as possible.

### 4. Constraint Enforcement
*   **Student Avoids**: If two students are listed in the `avoids.csv`, the algorithm will never place them in the same section. If a placement becomes impossible due to too many "avoids" constraints, the algorithm stops and identifies the problematic student.
*   **Gender Balancing**: Within the regular pool, students are sorted by gender and shuffled internally. This ensures that as classes are filled via the "Least-Filled-First" method, the gender ratio remains stable across all rooms.

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
| `max_iep` | Max IEP Students | No | Leave blank for no limit |
| `max_mll` | Max MLL Students | No | Leave blank for no limit |

### Student Avoids CSV (Optional — `avoids.csv`)
Prevents specific student pairs from being placed in the same classroom. Each row defines one pair that must be separated. The relationship is **bidirectional** — listing Student A → Student B also prevents B → A.

| Header | Description | Required | Options |
| :--- | :--- | :--- | :--- |
| `student_number_1` | First student's ID | Yes | Must match a `student_number` from the student file |
| `student_number_2` | Second student's ID | Yes | Must match a `student_number` from the student file |

> **Note**: Column headers are flexible — the algorithm reads the first two columns regardless of header names. If a student cannot be placed without violating an avoids constraint (e.g., too few sections), the balancer will throw an error identifying the student.

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
