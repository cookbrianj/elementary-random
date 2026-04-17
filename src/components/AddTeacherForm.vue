<template>
  <div class="card add-teacher-card">
    <div @click="isExpanded = !isExpanded" class="form-header">
      <div style="display: flex; align-items: center; gap: 0.5rem">
        <svg class="chevron" :class="{ 'up': isExpanded }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
        <h3>Add Teacher Manually</h3>
      </div>
    </div>

    <transition name="expand">
      <div v-if="isExpanded" class="form-content">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Teacher Name</label>
            <input 
              type="text" 
              v-model="form.teacher_name" 
              placeholder="e.g. Smith, Jane" 
              required 
            />
          </div>

          <div class="form-row">
            <div class="form-group" style="grid-column: span 2">
              <label>Section Number</label>
              <input 
                type="text" 
                v-model="form.section_number" 
                placeholder="e.g. 101" 
                required 
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Grade Level</label>
              <input 
                type="text" 
                v-model="form.grade_level" 
                placeholder="2" 
                required 
              />
            </div>
            <div class="form-group">
              <label>Max Students</label>
              <input 
                type="number" 
                v-model.number="form.max_students" 
                min="1" 
                max="100" 
                required 
              />
            </div>
          </div>

          <button type="submit" class="submit-btn" :disabled="!isFormValid">
            Add Section
          </button>
        </form>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

const emit = defineEmits(['add-teacher']);

const isExpanded = ref(false);

const form = reactive({
  teacher_name: '',
  section_number: '',
  grade_level: '',
  max_students: 25
});

const isFormValid = computed(() => {
  return form.teacher_name.trim() !== '' && 
         form.section_number.trim() !== '' && 
         form.grade_level.trim() !== '' && 
         form.max_students > 0;
});

const handleSubmit = () => {
  if (!isFormValid.value) return;
  
  emit('add-teacher', { ...form });
  
  // Reset form
  form.teacher_name = '';
  form.section_number = '';
  // Keep grade level as it's likely they are adding multiple for the same grade
  // form.grade_level = ''; 
};
</script>

<style scoped>
.add-teacher-card {
  margin-top: 1rem;
  padding: 0;
  border: 1px dashed var(--surface-border);
  background-color: rgba(255, 255, 255, 0.01);
}

.form-header {
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.form-header:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.form-header h3 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chevron {
  transition: transform 0.2s ease;
  color: var(--text-muted);
}

.chevron.up {
  transform: rotate(180deg);
}

.form-content {
  padding: 0 1rem 1rem 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.375rem;
}

input {
  width: 100%;
  padding: 0.625rem;
  background-color: var(--bg-color);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-sm);
  color: var(--text-active);
  font-family: var(--font-sans);
  font-size: 0.875rem;
}

input:focus {
  outline: none;
  border-color: var(--primary);
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.875rem;
  background-color: var(--primary);
  color: var(--bg-color);
  font-weight: 600;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

/* Simple transition */
.expand-enter-active, .expand-leave-active {
  transition: all 0.2s ease;
  max-height: 300px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
