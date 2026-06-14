document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadSection = document.getElementById('upload-section');
    const loadingSection = document.getElementById('loading-section');
    const resultsSection = document.getElementById('results-section');
    const errorSection = document.getElementById('error-section');
    const initialHeader = document.getElementById('initial-header');
    const sidebar = document.getElementById('sidebar');
    const analyzeAnotherBtn = document.getElementById('analyze-another');
    const tryAgainBtn = document.getElementById('try-again-btn');

    let radarChartInstance = null; // Store chart instance to destroy it on new analysis

    // Tab Navigation
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-target]');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            tabContents.forEach(tab => tab.classList.add('hidden'));
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => { dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false); });
    ['dragleave', 'drop'].forEach(eventName => { dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false); });
    dropZone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]), false);
    fileInput.addEventListener('change', function() { if (this.files && this.files[0]) handleFile(this.files[0]); });

    analyzeAnotherBtn.addEventListener('click', resetUI);
    tryAgainBtn.addEventListener('click', resetUI);

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    function handleFile(file) {
        if (file.type !== 'application/pdf') return showError("Please upload a valid PDF file.");
        if (file.size > 5 * 1024 * 1024) return showError("File is too large. Maximum size is 5MB.");
        uploadFile(file);
    }

    async function uploadFile(file) {
        showLoading();
        const formData = new FormData();
        formData.append('file', file);
        
        const jobRole = document.getElementById('job-role').value.trim();
        if (jobRole) formData.append('job_role', jobRole);

        try {
            const response = await fetch('/analyze', { method: 'POST', body: formData });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Server responded with an error');
            renderResults(data);
        } catch (error) {
            console.error('Error:', error);
            showError(error.message || "Failed to analyze resume. Please try again.");
        }
    }

    function showLoading() {
        uploadSection.classList.add('hidden');
        initialHeader.classList.add('hidden');
        resultsSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
    }

    function showError(message) {
        document.getElementById('error-message').textContent = message;
        loadingSection.classList.add('hidden');
        errorSection.classList.remove('hidden');
        fileInput.value = '';
    }

    function resetUI() {
        fileInput.value = '';
        sidebar.classList.add('hidden');
        initialHeader.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        if (radarChartInstance) { radarChartInstance.destroy(); }
        navItems[0].click();
    }

    function renderResults(data) {
        loadingSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        sidebar.classList.remove('hidden'); 
        
        const sections = data.sections || {};
        
        const structureKeys = ['ats_compatibility', 'resume_structure', 'formatting_quality', 'contact_information'];
        const experienceKeys = ['work_experience', 'academic_projects', 'education', 'certifications'];
        const skillsKeys = ['professional_summary', 'technical_skills', 'soft_skills', 'action_verbs', 'quantifiable_achievements', 'missing_information'];
        const jobKeys = ['keyword_optimization', 'job_readiness', 'industry_fit'];

        renderOverview(data, structureKeys, experienceKeys, skillsKeys, jobKeys);

        renderUnifiedTabContent('content-structure', structureKeys, sections);
        renderUnifiedTabContent('content-experience', experienceKeys, sections);
        renderUnifiedTabContent('content-skills', skillsKeys, sections);
        renderUnifiedTabContent('content-job', jobKeys, sections);
    }

    function renderOverview(data, sKeys, eKeys, skKeys, jKeys) {
        // Overall Score
        const score = data.overall_score || 0;
        document.getElementById('score-value').textContent = score;
        const progress = document.getElementById('score-progress');
        progress.style.strokeDashoffset = 251 - (score / 100) * 251;
        
        const label = document.getElementById('score-label');
        if (score >= 80) { progress.style.stroke = 'var(--success)'; label.textContent = "🌟 EXCELLENT"; label.className = 'score-label text-success'; }
        else if (score >= 60) { progress.style.stroke = 'var(--warning)'; label.textContent = "👍 AVERAGE"; label.className = 'score-label text-warning'; }
        else { progress.style.stroke = 'var(--danger)'; label.textContent = "⚠️ NEEDS WORK"; label.className = 'score-label text-danger'; }

        // Summary
        document.getElementById('overall-summary').textContent = data.overall_summary || "No summary provided.";

        // Keyword Match
        if (data.keyword_match) {
            const kw = data.keyword_match;
            document.getElementById('val-matched').textContent = `${kw.matched}%`;
            document.getElementById('val-partial').textContent = `${kw.partial}%`;
            document.getElementById('val-missing').textContent = `${kw.missing}%`;
            document.getElementById('kw-matched-text').textContent = `${kw.matched}%`;
            
            setTimeout(() => {
                document.getElementById('kw-partial-path').setAttribute('stroke-dasharray', `${kw.matched + kw.partial}, 100`);
                document.getElementById('kw-matched-path').setAttribute('stroke-dasharray', `${kw.matched}, 100`);
            }, 100);
        }

        // General Recommendations
        const recList = document.getElementById('general-recommendations');
        if (recList) {
            recList.innerHTML = '';
            const recs = (data.sections && data.sections.general_recommendations) ? data.sections.general_recommendations : [];
            if (recs.length > 0) {
                recs.forEach(r => {
                    const li = document.createElement('li');
                    li.textContent = r.replace(/\*\*/g, '');
                    recList.appendChild(li);
                });
            } else {
                recList.innerHTML = '<li>No general recommendations available.</li>';
            }
        }

        // Radar Chart Average Calculator
        const getAvg = (keys) => {
            let sum = 0, count = 0;
            keys.forEach(k => {
                if(data.sections && data.sections[k]) { sum += data.sections[k].score; count++; }
            });
            return count > 0 ? Math.round(sum/count) : 0;
        };

        const rData = [
            getAvg(sKeys),
            getAvg(eKeys),
            getAvg(skKeys),
            getAvg(jKeys)
        ];

        renderRadarChart(rData);
        renderOverviewBars(rData, ['Structure', 'Experience', 'Skills', 'Job Alignment']);
    }

    function renderOverviewBars(dataArr, labelsArr) {
        const container = document.getElementById('overview-section-scores');
        container.innerHTML = '';
        
        for(let i = 0; i < dataArr.length; i++) {
            const val = dataArr[i];
            const title = labelsArr[i];
            
            let colorVar = 'var(--success)';
            if (val < 60) colorVar = 'var(--danger)';
            else if (val < 80) colorVar = 'var(--warning)';

            const row = document.createElement('div');
            row.className = 'bar-row';
            row.innerHTML = `
                <div class="bar-label">${title}</div>
                <div class="bar-wrapper">
                    <div class="bar-fill" style="background: ${colorVar}; width: ${val}%;"></div>
                </div>
                <div class="bar-value">${val}%</div>
            `;
            container.appendChild(row);
        }
    }

    function renderRadarChart(dataArr) {
        const ctx = document.getElementById('radarChart').getContext('2d');
        if (radarChartInstance) radarChartInstance.destroy();

        radarChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Structure', 'Experience', 'Skills', 'Job Alignment'],
                datasets: [{
                    label: 'Score',
                    data: dataArr,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: '#ffffff',
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#000',
                    pointHoverBackgroundColor: '#000',
                    pointHoverBorderColor: '#ffffff',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#a1a1aa', font: { family: 'Inter', size: 12 } },
                        ticks: { display: false, min: 0, max: 100 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // New unified rendering engine (One minimalist card per tab, aggregate lists)
    function renderUnifiedTabContent(containerId, keys, sectionsData) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        const template = document.getElementById('tab-content-template');
        const clone = template.content.cloneNode(true);
        
        const barContainer = clone.querySelector('.bar-chart-container');
        const strengthsUl = clone.querySelector('.strengths-list');
        const weaknessesUl = clone.querySelector('.weaknesses-list');
        const recommendationsUl = clone.querySelector('.recommendations-list');

        let allStrengths = [];
        let allWeaknesses = [];
        let allRecommendations = [];

        keys.forEach(key => {
            if (sectionsData[key]) {
                const data = sectionsData[key];
                
                // Add Bar Chart Row
                const title = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const val = data.score || 0;
                let colorVar = 'var(--success)';
                if (val < 60) colorVar = 'var(--danger)';
                else if (val < 80) colorVar = 'var(--warning)';

                const row = document.createElement('div');
                row.className = 'bar-row';
                row.innerHTML = `
                    <div class="bar-label">${title}</div>
                    <div class="bar-wrapper">
                        <div class="bar-fill" style="background: ${colorVar}; width: ${val}%;"></div>
                    </div>
                    <div class="bar-value">${val}%</div>
                `;
                barContainer.appendChild(row);

                // Aggregate texts
                if(data.strengths) allStrengths = allStrengths.concat(data.strengths);
                if(data.weaknesses) allWeaknesses = allWeaknesses.concat(data.weaknesses);
                if(data.recommendations) allRecommendations = allRecommendations.concat(data.recommendations);
            }
        });

        // Filter out massive amounts of text to keep it minimalist. Pick top 4.
        populateList(strengthsUl, allStrengths.slice(0, 5), "No significant strengths found.");
        populateList(weaknessesUl, allWeaknesses.slice(0, 5), "No areas of improvement found.");
        populateList(recommendationsUl, allRecommendations.slice(0, 4), "No specific recommendations.");

        container.appendChild(clone);
    }

    function populateList(ul, items, emptyMsg) {
        ul.innerHTML = '';
        if (items && items.length > 0) {
            // Deduplicate simple strings to keep it clean
            const uniqueItems = [...new Set(items)];
            uniqueItems.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.replace(/\*\*/g, '');
                ul.appendChild(li);
            });
        } else {
            ul.innerHTML = `<li>${emptyMsg}</li>`;
        }
    }
});
