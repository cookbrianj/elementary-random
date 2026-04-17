<template>
  <div class="help-container">
    <aside class="help-sidebar">
      <h3>On This Page</h3>
      <nav>
        <ul>
          <li><a href="#overview" @click.prevent="scrollTo('overview')">Overview</a></li>
          <li><a href="#student-format" @click.prevent="scrollTo('student-format')">Student File Layout</a></li>
          <li><a href="#class-format" @click.prevent="scrollTo('class-format')">Class File Layout</a></li>
          <li><a href="#manual-teachers" @click.prevent="scrollTo('manual-teachers')">Adding Teachers Manually</a></li>
          <li><a href="#capacity" @click.prevent="scrollTo('capacity')">Adjusting Capacities</a></li>
          <li><a href="#saving" @click.prevent="scrollTo('saving')">Saving Scenarios</a></li>
          <li><a href="#resuming" @click.prevent="scrollTo('resuming')">Resuming Sessions</a></li>
          <li><a href="#autosave" @click.prevent="scrollTo('autosave')">Auto-Save Fail-safe</a></li>
        </ul>
      </nav>
      <button @click="$emit('back')" class="back-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Dashboard
      </button>
    </aside>

    <main class="help-content">
      <section id="overview" class="help-section">
        <h2>Overview</h2>
        <div class="card help-card">
          <p>The Student Placement Dashboard is designed to help school administrators distribute students equitably across classrooms while balancing key demographics like Gender, IEP status, and MLL status.</p>
          <p>The tool uses a balancing algorithm that prioritizes pre-allocated (locked) students first, then distributes the remaining student body to achieve the most balanced classrooms possible.</p>
        </div>
      </section>

      <section id="student-format" class="help-section">
        <h2>Student CSV Layout</h2>
        <div class="card help-card">
          <p>To import your student body, upload a CSV file with the following headers (case-insensitive):</p>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Header</th>
                  <th>Description</th>
                  <th>Value Examples</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>student_number</code></td>
                  <td>Unique ID for the student (Required)</td>
                  <td>1234567, 00982</td>
                </tr>
                <tr>
                  <td><code>student_name</code></td>
                  <td>Last Name, First Name (Required)</td>
                  <td>Doe, John</td>
                </tr>
                <tr>
                  <td><code>grade_level</code></td>
                  <td>Grade level identifier (Required)</td>
                  <td>2, 02, KF</td>
                </tr>
                <tr>
                  <td><code>gender</code></td>
                  <td>Student gender (Required)</td>
                  <td>M, F</td>
                </tr>
                <tr>
                  <td><code>iep</code></td>
                  <td>IEP/Special Ed Status</td>
                  <td>1 (Yes) or 0 (No)</td>
                </tr>
                <tr>
                  <td><code>mll</code></td>
                  <td>Multilingual Learner Status</td>
                  <td>1 (Yes) or 0 (No)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="csv-example">
            <header>
              <span>Example CSV Content</span>
              <button @click="downloadSample('students')" class="download-link">Download Template</button>
            </header>
            <pre>student_number,student_name,grade_level,gender,iep,mll
1001,"Smith, Sarah",2,F,0,0
1002,"Brown, Mike",2,M,1,0
1003,"Garcia, Maria",2,F,0,1</pre>
          </div>
        </div>
      </section>

      <section id="class-format" class="help-section">
        <h2>Class CSV Layout</h2>
        <div class="card help-card">
          <p>To define your available classrooms, upload a CSV file with these headers:</p>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Header</th>
                  <th>Description</th>
                  <th>Value Examples</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>course_number</code></td>
                  <td>ID for the course (Required)</td>
                  <td>101, 102, MUS</td>
                </tr>
                <tr>
                  <td><code>teacher_name</code></td>
                  <td>The name displayed on the card</td>
                  <td>Mrs. Johnson</td>
                </tr>
                <tr>
                  <td><code>grade_level</code></td>
                  <td>Must match student grade levels</td>
                  <td>2</td>
                </tr>
                <tr>
                  <td><code>max_students</code></td>
                  <td>Target capacity for this room</td>
                  <td>25, 22</td>
                </tr>
                <tr>
                  <td><code>section_number</code></td>
                  <td>Unique code for the section</td>
                  <td>201, 202, A</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="csv-example">
            <header>
              <span>Example CSV Content</span>
              <button @click="downloadSample('classes')" class="download-link">Download Template</button>
            </header>
            <pre>course_number,teacher_name,grade_level,max_students,section_number
101,Mrs. Johnson,2,25,201
101,Mr. Davis,2,24,202</pre>
          </div>
        </div>
      </section>

      <section id="manual-teachers" class="help-section">
        <h2>Adding Teachers Manually</h2>
        <div class="card help-card">
          <div class="feature-info">
            <div class="icon-box">➕</div>
            <div>
              <p>You can supplement your imported list with new classrooms at any time without re-uploading your CSV.</p>
              <ul>
                <li>Navigate to the <strong>Add Teacher Manually</strong> card on the landing page.</li>
                <li>Fill in the <strong>Teacher Name</strong>, <strong>Section Number</strong>, and <strong>Max Students</strong>.</li>
                <li>Click <strong>Add Section</strong>. The teacher will instantly appear in your active dashboard cards and dropdowns.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="capacity" class="help-section">
        <h2>Adjusting Capacities</h2>
        <div class="card help-card">
          <div class="feature-info highlight">
            <div class="icon-box">⚖️</div>
            <div>
              <p>You can fine-tune class sizes directly from the dashboard cards to accommodate larger groups or smaller environments.</p>
              <ul>
                <li>Locate the <strong>Student Count</strong> at the top of any teacher card (e.g. <code>18 / 25</code>).</li>
                <li><strong>Click the number</strong> representing the maximum (the <code>25</code> in this case).</li>
                <li>Enter the new target capacity in the popup and press <strong>Enter</strong>.</li>
                <li>The progress bar and balancing logic will update immediately based on this new limit.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="saving" class="help-section">
        <h2>Saving Scenarios</h2>
        <div class="card help-card">
          <div class="feature-info">
            <div class="icon-box">💾</div>
            <div>
              <p>Once you have run the algorithm and made manual adjustments, you can export your entire workspace as a <strong>Scenario File</strong>.</p>
              <ul>
                <li>Click <strong>Save Scenario</strong> in the dashboard header.</li>
                <li>Enter a name when prompted (e.g. "Draft 1 - Balanced").</li>
                <li>Your browser will download a <code>.json</code> file containing all placements, locks, and data.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="resuming" class="help-section">
        <h2>Resuming Sessions</h2>
        <div class="card help-card">
          <div class="feature-info">
            <div class="icon-box">📂</div>
            <div>
              <p>To pick up where you left off or view a previous draft:</p>
              <ul>
                <li>Find the <strong>Resume Session</strong> card on the landing page.</li>
                <li>Upload your saved <code>.json</code> scenario file.</li>
                <li>The dashboard will instantly restore all students, classes, and manual moves from that session.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="autosave" class="help-section">
        <h2>Auto-Save Fail-safe</h2>
        <div class="card help-card">
          <div class="feature-info highlight">
            <div class="icon-box">⚡</div>
            <div>
              <p>The dashboard continuously monitors your changes and saves them to your browser's local storage.</p>
              <p>If you accidentally refresh your browser or your tab closes, your current work will be <strong>automatically restored</strong> the next time you open the dashboard.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
defineEmits(['back']);

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};

const downloadSample = (type) => {
  let content = '';
  let filename = '';
  
  if (type === 'students') {
    content = 'student_number,student_name,grade_level,gender,iep,mll\n1001,"Smith, Sarah",2,F,0,0\n1002,"Brown, Mike",2,M,1,0\n1003,"Garcia, Maria",2,F,0,1';
    filename = 'sample_students.csv';
  } else {
    content = 'course_number,teacher_name,grade_level,max_students,section_number\n"101","Mrs. Johnson",2,25,201\n"101","Mr. Davis",2,24,202';
    filename = 'sample_classes.csv';
  }
  
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.help-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 0;
}

@media (max-width: 992px) {
  .help-container {
    grid-template-columns: 1fr;
  }
  .help-sidebar {
    position: static;
    height: auto;
  }
}

.help-sidebar {
  position: sticky;
  top: 2rem;
  height: min-content;
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-border);
}

.help-sidebar h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.help-sidebar nav ul {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem 0;
}

.help-sidebar nav li {
  margin-bottom: 0.75rem;
}

.help-sidebar nav a {
  color: var(--text-active);
  text-decoration: none;
  font-size: 0.9375rem;
  transition: color 0.2s ease;
}

.help-sidebar nav a:hover {
  color: var(--primary);
}

.back-btn {
  width: 100%;
  justify-content: center;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.help-section h2 {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: #ffffff;
  border-left: 4px solid var(--primary);
  padding-left: 1rem;
}

.help-card {
  padding: 2rem;
}

.help-card p {
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.table-container {
  overflow-x: auto;
  margin: 1.5rem 0;
  border-radius: var(--radius-sm);
  background-color: rgba(255, 255, 255, 0.02);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

th {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  font-weight: 600;
  color: var(--primary);
}

td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-active);
}

code {
  background-color: rgba(197, 179, 88, 0.1);
  color: var(--primary);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.csv-example {
  background-color: #000000;
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-top: 1.5rem;
  border: 1px solid var(--surface-border);
}

.csv-example header {
  background-color: var(--surface-border);
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.download-link {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-link:hover {
  background-color: var(--primary);
  color: var(--bg-color);
}

.csv-example pre {
  padding: 1rem;
  font-family: monospace;
  font-size: 0.875rem;
  color: #10b981;
  margin: 0;
  overflow-x: auto;
}

.feature-info {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.icon-box {
  font-size: 2rem;
  background-color: rgba(255, 255, 255, 0.05);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.highlight .icon-box {
  background-color: rgba(197, 179, 88, 0.1);
}

.feature-info ul {
  padding-left: 1.25rem;
  margin-top: 1rem;
}

.feature-info li {
  margin-bottom: 0.5rem;
}
</style>
