<template>
  <div class="card master-roster-card">
    <div class="roster-toggle" @click="isExpanded = !isExpanded">
      <div style="display: flex; align-items: center; gap: 0.75rem">
        <svg class="chevron" :class="{ 'up': isExpanded }" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        <h3>Master Student Roster</h3>
        <span class="count-badge" v-if="!isExpanded">{{ students.length }} Students</span>
      </div>
      <span class="text-muted" style="font-size: 0.8rem">{{ isExpanded ? 'Click to collapse' : 'Click to expand search view' }}</span>
    </div>

    <div v-if="isExpanded" class="roster-content">
      <div class="search-container">
        <div class="search-input-wrapper">
          <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search by student name or number..." 
            class="search-input"
          />
        </div>
        <div class="results-meta">
          Showing {{ filteredStudents.length }} of {{ students.length }} students
        </div>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th style="width: 40px"></th>
              <th @click="toggleSort('student_name')" class="sortable">
                Name 
                <span v-if="sortBy === 'student_name'" class="sort-indicator">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="toggleSort('student_number')" class="sortable">
                Student #
                <span v-if="sortBy === 'student_number'" class="sort-indicator">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="toggleSort('teacher_name')" class="sortable">
                Teacher
                <span v-if="sortBy === 'teacher_name'" class="sort-indicator">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.student_number" :class="{ 'is-locked': student.isLocked }">
              <td class="lock-cell">
                <button class="lock-btn" @click.stop="toggleLock(student)" :title="student.isLocked ? 'Unlock student' : 'Lock student to this class'">
                  <svg v-if="student.isLocked" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                </button>
              </td>
              <td class="name-cell">{{ student.student_name }}</td>
              <td class="text-muted">{{ student.student_number }}</td>
              <td class="teacher-cell">
                <span class="teacher-tag">{{ student.teacher_name }} ({{ student.section_number }})</span>
              </td>
              <td>
                <div class="tags">
                  <span v-if="isTrue(student.iep)" class="tag iep">IEP</span>
                  <span v-if="isTrue(student.mll)" class="tag mll">MLL</span>
                  <span v-if="student.gender" class="tag default">{{ student.gender }}</span>
                </div>
              </td>
            </tr>
            <tr v-if="filteredStudents.length === 0">
              <td colspan="4" class="empty-state">No students found matching "{{ searchQuery }}"</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  students: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['toggle-lock']);

const isExpanded = ref(false);
const searchQuery = ref("");
const sortBy = ref("student_name");
const sortOrder = ref("asc");

const isTrue = (val) => {
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y' || val === true;
};

const toggleSort = (key) => {
  if (sortBy.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = key;
    sortOrder.value = 'asc';
  }
};

const toggleLock = (student) => {
  emit('toggle-lock', {
    student_number: student.student_number,
    section_number: student.section_number
  });
};

const filteredStudents = computed(() => {
  let list = props.students;
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(s => 
      s.student_name.toLowerCase().includes(q) || 
      String(s.student_number).includes(q)
    );
  }
  
  return [...list].sort((a, b) => {
    let valA = a[sortBy.value];
    let valB = b[sortBy.value];
    
    if (sortBy.value === 'student_number') {
      valA = parseInt(valA, 10) || 0;
      valB = parseInt(valB, 10) || 0;
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }
    
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
});
</script>

<style scoped>
.master-roster-card {
  margin-top: 2rem;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

.roster-toggle {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.02);
  transition: background-color 0.2s ease;
}

.roster-toggle:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.roster-toggle h3 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--primary);
}

.chevron {
  transition: transform 0.2s ease;
  color: var(--primary);
}

.chevron.up {
  transform: rotate(180deg);
}

.count-badge {
  background-color: var(--surface-border);
  color: var(--text-muted);
  padding: 0.125rem 0.5rem;
  border-radius: 20px;
  font-size: 0.75rem;
}

.roster-content {
  padding: 0 0 1.5rem 0;
  border-top: 1px solid var(--surface-border);
  animation: slideDown 0.3s ease-out;
}

.search-container {
  padding: 1.5rem;
  background-color: rgba(15, 23, 42, 0.3);
  position: sticky;
  top: 0;
  z-index: 20;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  background-color: var(--bg-color);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-md);
  color: var(--text-active);
  font-family: var(--font-sans);
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(197, 179, 88, 0.15);
  outline: none;
}

.results-meta {
  margin-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.table-scroll {
  max-height: 500px;
  overflow-y: auto;
  padding: 0 1.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.825rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--surface-border);
  position: sticky;
  top: 0;
  background-color: var(--surface-color);
  z-index: 10;
}

th.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.2s ease;
}

th.sortable:hover {
  color: var(--primary);
}

.sort-indicator {
  margin-left: 0.25rem;
  color: var(--primary);
  font-size: 1rem;
}

td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--surface-border);
  font-size: 0.9rem;
}

.name-cell {
  font-weight: 500;
  color: var(--text-active);
}

.teacher-tag {
  background-color: rgba(197, 179, 88, 0.1);
  color: var(--primary);
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.8rem;
}

.tags {
  display: flex;
  gap: 0.25rem;
}

.tag {
  font-size: 0.65rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-weight: bold;
}

.tag.iep { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
.tag.mll { background-color: rgba(245, 158, 11, 0.1); color: #fbbf24; }
.tag.default { background-color: rgba(148, 163, 184, 0.1); color: var(--text-muted); }

tr.is-locked {
  background-color: rgba(197, 179, 88, 0.05);
}
tr.is-locked td {
  color: var(--text-active);
  font-weight: 500;
}

.lock-cell {
  text-align: center;
  padding: 0.75rem 0.25rem !important;
}

.lock-btn {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease;
}

.lock-btn:hover {
  transform: scale(1.2);
  color: var(--primary-hover);
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
