<template>
  <div class="card chart-card" :class="{ 'is-expanded': showRoster }" @dragover.prevent @drop="handleDrop">
    <div class="card-content">
      <div class="header">
        <div class="title-group">
          <h4>{{ summary.teacher_name }}</h4>
          <div class="sub-title">{{ summary.course_number }}.{{ summary.section_number }}</div>
        </div>
        <div class="actions">
          <span class="badge" v-if="!isEditingMax" @click="startEditingMax" title="Click to edit max capacity">
            {{ summary.total }} / {{ summary.max }}
          </span>
          <input 
            v-else
            ref="maxInputRef"
            type="number"
            class="badge-input"
            v-model.number="tempMax"
            @blur="saveMax"
            @keyup.enter="saveMax"
          />
          <button class="delete-section-btn" @click.stop="confirmDelete" title="Delete this section">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </div>
      <div class="chart-container">
        <Bar :data="chartData" :options="chartOptions" :plugins="[barLabelsPlugin]" />
      </div>
    </div>
    
    <div class="expansion-area" v-if="showRoster">
      <div class="divider"></div>
      <div class="roster-header">
        <h5>Class Roster</h5>
        <button class="secondary btn-sm" @click="copyStudentNumbers">
          <svg v-if="!copied" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {{ copied ? 'Copied!' : 'Copy Numbers' }}
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
               <th style="width: 40px"></th>
               <th>Number</th>
               <th>Name</th>
               <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in summary.roster" :key="student.student_number" :draggable="!student.isLocked" @dragstart="handleDragStart($event, student)" class="draggable-row" :class="{ 'is-locked': student.isLocked }">
              <td class="lock-cell">
                <button class="lock-btn" @click.stop="toggleLock(student)" :title="student.isLocked ? 'Unlock student' : 'Lock student to this class'">
                  <svg v-if="student.isLocked" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                </button>
              </td>
              <td>{{ student.student_number }}</td>
              <td>{{ student.student_name }}</td>
              <td>
                <div class="tags">
                  <span v-if="student.iep" class="tag iep">IEP</span>
                  <span v-if="student.mll" class="tag mll">MLL</span>
                  <span v-if="student.gender" class="tag default">{{ student.gender }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({
  summary: {
    type: Object,
    required: true
  },
  showRoster: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['drop-student', 'update-max', 'toggle-lock', 'delete-section']);

const copied = ref(false);
const isEditingMax = ref(false);
const tempMax = ref(0);
const maxInputRef = ref(null);

const startEditingMax = () => {
  tempMax.value = props.summary.max;
  isEditingMax.value = true;
  setTimeout(() => {
    if (maxInputRef.value) maxInputRef.value.focus();
  }, 10);
};

const saveMax = () => {
  if (!isEditingMax.value) return;
  isEditingMax.value = false;
  if (tempMax.value > 0 && tempMax.value !== props.summary.max) {
    emit('update-max', {
      section_number: props.summary.section_number,
      newMax: tempMax.value
    });
  }
};

const confirmDelete = () => {
  emit('delete-section', props.summary.section_number);
};

const copyStudentNumbers = async () => {
  const numbers = props.summary.roster.map(s => s.student_number).join('\n');
  if (!navigator.clipboard) return;
  try {
    await navigator.clipboard.writeText(numbers);
    copied.value = true;
    setTimeout(() => copied.value = false, 2000);
  } catch (err) {
    console.error('Failed to copy', err);
  }
};

const handleDragStart = (e, student) => {
  e.dataTransfer.dropEffect = 'move';
  e.dataTransfer.setData('application/json', JSON.stringify({
    student_number: student.student_number,
    source_section: props.summary.section_number
  }));
};

const handleDrop = (e) => {
  try {
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    if (data && data.student_number && data.source_section !== props.summary.section_number) {
      emit('drop-student', {
        student_number: data.student_number,
        source_section: data.source_section,
        target_section: props.summary.section_number
      });
    }
  } catch(err) {
    // ignore
  }
};

const toggleLock = (student) => {
  emit('toggle-lock', {
    student_number: student.student_number,
    section_number: props.summary.section_number
  });
};

const chartData = computed(() => {
  const maleCount = props.summary.maleCount || 0;
  const femaleCount = props.summary.femaleCount || 0;
  const unspecCount = Math.max(0, props.summary.total - maleCount - femaleCount);
  
  return {
    labels: ['Total', 'IEP', 'MLL'],
    datasets: [
      {
        label: 'Male',
        backgroundColor: '#C5B358', // Vegas Gold
        data: [maleCount, 0, 0]
      },
      {
        label: 'Female',
        backgroundColor: '#F8FAFC', // White/Silver
        data: [femaleCount, 0, 0]
      },
      {
        label: 'Other',
        backgroundColor: '#333333', // Dark Grey
        data: [unspecCount, 0, 0]
      },
      {
        label: 'IEP',
        backgroundColor: '#A39140', // Darker Gold
        data: [0, props.summary.iepCount, 0]
      },
      {
        label: 'MLL',
        backgroundColor: '#E5D68E', // Lighter Gold
        data: [0, 0, props.summary.mllCount]
      }
    ]
  }
});

const barLabelsPlugin = {
  id: 'barLabels',
  afterDatasetsDraw(chart, args, options) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((bar, index) => {
        const data = dataset.data[index];
        if (data > 0) {
          ctx.save();
          // Draw text color based on dataset background for contrast
          ctx.fillStyle = dataset.label === 'Other' ? '#FFFFFF' : '#0c0c0c';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold 12px sans-serif';
          const yPos = bar.y + (bar.height / 2);
          ctx.fillText(data, bar.x, yPos);
          ctx.restore();
        }
      });
    });
  }
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      stacked: true,
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: '#94A3B8',
        stepSize: 1
      }
    },
    x: {
      stacked: true,
      grid: {
        display: false
      },
      ticks: {
        color: '#94A3B8'
      }
    }
  }
};
</script>

<style scoped>
.chart-card {
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.5s ease-out both;
}
.card-content {
  display: flex;
  flex-direction: column;
  height: 300px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.title-group {
  display: flex;
  flex-direction: column;
}
.header h4 {
  margin: 0;
  font-size: 1.125rem;
  color: #ffffff;
}
.sub-title {
  font-size: 0.825rem;
  color: var(--primary);
  font-family: monospace;
  font-weight: 500;
  margin-top: 0.25rem;
}
.badge {
  background: linear-gradient(135deg, var(--primary), #D4C46A);
  color: #0c0c0c;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 0 0 var(--primary-glow);
}
.badge:hover {
  background: linear-gradient(135deg, var(--primary-hover), var(--primary));
  box-shadow: 0 0 12px var(--primary-glow);
  transform: scale(1.05);
}
.badge-input {
  background-color: var(--primary);
  color: #fff;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: bold;
  width: 60px;
  text-align: center;
  outline: none;
  font-family: var(--font-sans);
}
.badge-input::-webkit-outer-spin-button,
.badge-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.delete-section-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  opacity: 0.6;
}
.delete-section-btn:hover {
  color: #fb7185;
  opacity: 1;
  transform: scale(1.1);
}
.chart-container {
  flex: 1;
  position: relative;
  pointer-events: none;
}

.expansion-area {
  margin-top: 1rem;
  animation: slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--surface-border), rgba(197, 179, 88, 0.2), var(--surface-border), transparent);
  margin-bottom: 1rem;
}
.roster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.roster-header h5 {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
}
.table-container {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
th, td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--surface-border);
}
th {
  background-color: rgba(15, 23, 42, 0.5);
  position: sticky;
  top: 0;
  z-index: 10;
  color: var(--text-muted);
  font-weight: 500;
}
tr:last-child td {
  border-bottom: none;
}
tr.draggable-row:not(.is-locked) {
  cursor: grab;
}
tr.draggable-row:not(.is-locked):active {
  cursor: grabbing;
}
tr.is-locked {
  background: linear-gradient(90deg, rgba(197, 179, 88, 0.08), rgba(197, 179, 88, 0.03));
  cursor: default;
}
tr.is-locked td {
  color: var(--text-active);
  font-weight: 500;
}
.lock-cell {
  text-align: center;
  padding: 0.5rem 0.25rem !important;
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
.tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.tag {
  font-size: 0.65rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
}
.tag.iep {
  background-color: rgba(16, 185, 129, 0.2);
  color: var(--success);
}
.tag.mll {
  background-color: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}
.tag.default {
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1));
  color: var(--text-muted);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
