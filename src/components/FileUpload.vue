<template>
  <div class="card file-upload-card">
    <div class="header">
      <h3>{{ title }}</h3>
      <span v-if="localFile" class="status success">Ready</span>
      <span v-else class="status pending">Waiting</span>
    </div>
    
    <label class="drop-zone" :class="{ 'has-file': !!localFile }">
      <input type="file" accept=".csv" @change="handleFileDrop" hidden />
      <div v-if="!localFile">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p>Click to upload {{ title }} CSV</p>
      </div>
      <div v-else>
        <p><strong>{{ localFile.name }}</strong></p>
        <p class="text-sm">({{ parseResult?.length }} rows processed)</p>
      </div>
    </label>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Papa from 'papaparse';

const props = defineProps({
  title: String
});

const emit = defineEmits(['data-loaded']);

const localFile = ref(null);
const parseResult = ref(null);

const handleFileDrop = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  localFile.value = file;
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.toLowerCase().trim(),
    complete: (results) => {
      parseResult.value = results.data;
      emit('data-loaded', results.data);
    }
  });
};
</script>

<style scoped>
.file-upload-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header h3 {
  margin: 0;
  font-size: 1.125rem;
}
.status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-weight: 600;
  text-transform: uppercase;
}
.status.success {
  background-color: rgba(16, 185, 129, 0.2);
  color: var(--success);
}
.status.pending {
  background-color: rgba(148, 163, 184, 0.2);
  color: var(--text-muted);
}
.drop-zone {
  border: 2px dashed var(--surface-border);
  border-radius: var(--radius-sm);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: var(--transition);
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.drop-zone:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.drop-zone.has-file {
  border: 2px solid var(--success);
  color: var(--text-active);
  background-color: rgba(16, 185, 129, 0.05);
}
.text-sm {
  font-size: 0.875rem;
  color: var(--text-muted);
}
</style>
