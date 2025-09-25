(function() {
    'use strict';

    let cachedAudioEnabled = true;
    let cachedConfettiEnabled = true;
    let cachedPersistenceEnabled = true;
    let cachedSoundThresholds = [];
    let cachedConfettiThresholds = [];
    let cachedSectionSoundThresholds = [];
    let cachedSectionConfettiThresholds = [];
    const audioPlayer = new Audio();

    function loadAndCacheSettings() {
        const defaultSoundThresholds = [{
                min: 1500,
                max: 1600,
                sound: 'audio/Victory.mp3'
            },
            {
                min: 1350,
                max: 1499,
                sound: 'audio/Success_Trumpet.mp3'
            },
            {
                min: 1100,
                max: 1349,
                sound: 'audio/Disappointed_Spongebob.mp3'
            },
            {
                min: 400,
                max: 1099,
                sound: 'audio/Boom.mp3'
            }
        ];
        const defaultConfettiThresholds = [{
                min: 1500,
                max: 1600,
                amount: 'high'
            },
            {
                min: 1350,
                max: 1499,
                amount: 'medium'
            },
            {
                min: 1100,
                max: 1349,
                amount: 'low'
            }
        ];
        const defaultSectionSoundThresholds = [{
                min: 700,
                max: 800,
                sound: 'audio/Victory.mp3'
            },
            {
                min: 600,
                max: 699,
                sound: 'audio/Success_Trumpet.mp3'
            },
            {
                min: 500,
                max: 599,
                sound: 'audio/Disappointed_Spongebob.mp3'
            },
            {
                min: 200,
                max: 499,
                sound: 'audio/Boom.mp3'
            }
        ];
        const defaultSectionConfettiThresholds = [{
                min: 700,
                max: 800,
                amount: 'high'
            },
            {
                min: 600,
                max: 699,
                amount: 'medium'
            },
            {
                min: 500,
                max: 599,
                amount: 'low'
            }
        ];
        chrome.storage.local.get(['audioEnabled', 'confettiEnabled', 'persistenceEnabled', 'soundThresholds', 'confettiThresholds', 'sectionSoundThresholds', 'sectionConfettiThresholds'], (data) => {
            if (data.audioEnabled !== undefined) cachedAudioEnabled = data.audioEnabled;
            if (data.confettiEnabled !== undefined) cachedConfettiEnabled = data.confettiEnabled;
            if (data.persistenceEnabled !== undefined) cachedPersistenceEnabled = data.persistenceEnabled;
            cachedSoundThresholds = (data.soundThresholds && data.soundThresholds.length > 0) ? data.soundThresholds : defaultSoundThresholds;
            cachedConfettiThresholds = (data.confettiThresholds && data.confettiThresholds.length > 0) ? data.confettiThresholds : defaultConfettiThresholds;
            cachedSectionSoundThresholds = (data.sectionSoundThresholds && data.sectionSoundThresholds.length > 0) ? data.sectionSoundThresholds : defaultSectionSoundThresholds;
            cachedSectionConfettiThresholds = (data.sectionConfettiThresholds && data.sectionConfettiThresholds.length > 0) ? data.sectionConfettiThresholds : defaultSectionConfettiThresholds;
        });
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace !== 'local') return;
        if (changes.audioEnabled) cachedAudioEnabled = changes.audioEnabled.newValue;
        if (changes.confettiEnabled) cachedConfettiEnabled = changes.confettiEnabled.newValue;
        if (changes.persistenceEnabled) cachedPersistenceEnabled = changes.persistenceEnabled.newValue;
        if (changes.soundThresholds) cachedSoundThresholds = changes.soundThresholds.newValue;
        if (changes.confettiThresholds) cachedConfettiThresholds = changes.confettiThresholds.newValue;
        if (changes.sectionSoundThresholds) cachedSectionSoundThresholds = changes.sectionSoundThresholds.newValue;
        if (changes.sectionConfettiThresholds) cachedSectionConfettiThresholds = changes.sectionConfettiThresholds.newValue;
    });

    loadAndCacheSettings();

    const HIDDEN_TEXT = '?';
    const SCORE_SELECTORS = [
        '[data-qc-id*=":db-"] .display-flex'
    ];

    function findScoreElements() {
        const allElements = document.querySelectorAll('*');
        const scoreElements = [];

        allElements.forEach(element => {
            if (element.dataset.scoreHiderProcessed) return;

            const text = element.textContent.trim();

            if (/^\d+$/.test(text)) {
                const num = parseInt(text);
                if ((num >= 400 && num <= 1600) || (num >= 200 && num <= 800) || (num >= 2 && num <= 8)) {

                    if (element.classList.contains('cb-roboto-light') && element.classList.contains('cb-margin-right-8')) {
                        scoreElements.push(element.parentElement);
                    }
                }
            }
        });

        return scoreElements;
    }

    function hideScores() {
        chrome.storage.local.get('revealedScores', (data) => {
            const revealedScores = data.revealedScores || [];

            SCORE_SELECTORS.forEach(selector => {
                document.querySelectorAll(selector).forEach(element => {
                    if (element.dataset.scoreHiderProcessed) return;

                    const elementText = element.textContent.trim();
                    let scoreElement, text;

                    if (/^\d+$/.test(elementText) && (parseInt(elementText) >= 400 && parseInt(elementText) <= 1600 || parseInt(elementText) >= 200 && parseInt(elementText) <= 800 || parseInt(elementText) >= 2 && parseInt(elementText) <= 8)) {

                        scoreElement = element;
                        text = elementText;
                    } else {

                        scoreElement = element.querySelector('.cb-roboto-light.cb-margin-right-8') || element.querySelector('[data-qc-id*="ds-"]');
                        if (!scoreElement) return;
                        text = scoreElement.textContent.trim();
                        if (!(/^\d+$/.test(text) && (parseInt(text) >= 400 && parseInt(text) <= 1600 || parseInt(text) >= 200 && parseInt(text) <= 800 || parseInt(text) >= 2 && parseInt(text) <= 8))) return;
                    }

                    const scoreId = `${window.location.pathname}--${text}`;
                    if (cachedPersistenceEnabled && revealedScores.includes(scoreId)) {
                        element.dataset.scoreHiderProcessed = 'true';
                        element.dataset.originalContent = element.innerHTML;
                        element.dataset.originalTextContent = element.textContent;
                        element.dataset.originalScore = text;
                        element.innerHTML = element.dataset.originalContent;

                        const restoredScoreElement = element.querySelector('.cb-roboto-light.cb-margin-right-8') || element.querySelector('[data-qc-id*="ds-"]') || element;
                        if (restoredScoreElement && restoredScoreElement.style.display === 'none') {
                            restoredScoreElement.style.display = '';
                        }
                        restoredScoreElement.style.setProperty('visibility', 'visible', 'important');
                        element.classList.add('sat-score-revealed');
                    } else {
                        hideScoreElement(element, scoreElement);
                    }
                });
            });

            const fallbackElements = findScoreElements();
            fallbackElements.forEach(element => {
                if (element.dataset.scoreHiderProcessed) return;
                const scoreElement = element.querySelector('.cb-roboto-light.cb-margin-right-8');
                if (!scoreElement) return;
                const text = scoreElement.textContent.trim();
                const scoreId = `${window.location.pathname}--${text}`;
                if (cachedPersistenceEnabled && revealedScores.includes(scoreId)) {
                    element.dataset.scoreHiderProcessed = 'true';
                    element.dataset.originalContent = element.innerHTML;
                    element.dataset.originalTextContent = element.textContent;
                    element.dataset.originalScore = text;
                    element.innerHTML = element.dataset.originalContent;

                    const restoredScoreElement = element.querySelector('.cb-roboto-light.cb-margin-right-8');
                    if (restoredScoreElement && restoredScoreElement.style.display === 'none') {
                        restoredScoreElement.style.display = '';
                    }
                    restoredScoreElement.style.setProperty('visibility', 'visible', 'important');
                    element.classList.add('sat-score-revealed');
                } else {
                    hideScoreElement(element, scoreElement);
                }
            });
        });
    }

    function getScoreId(element) {
        const originalScore = (element.dataset.originalScore || element.textContent.trim()).replace(/\D/g, '');
        let sectionName = '';
        const x = element.getAttribute('x');
        if (x) {
            const svgParent = element.closest('svg');
            if (svgParent) {
                const el = svgParent.querySelector(`.section-name[x="${x}"]`);
                if (el) sectionName = el.textContent.trim();
            }
        }
        if (!sectionName) {
            const header = element.closest('.panel-section-header');
            if (header) {
                const el = header.querySelector('.panel-section-header-text');
                if (el) sectionName = el.textContent.trim();
            }
        }
        return `${window.location.pathname}-${sectionName}-${originalScore}`;
    }

    function hideScoreElement(element, scoreElement) {
        element.dataset.scoreHiderProcessed = 'true';
        element.dataset.originalContent = element.innerHTML;
        element.dataset.originalTextContent = element.textContent;
        element.dataset.originalScore = scoreElement.textContent.trim();

        const revealButton = document.createElement('button');
        revealButton.className = 'sat-score-reveal-btn';
        revealButton.innerHTML = `
            <span class="reveal-text">Click to reveal score</span>
        `;

        revealButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            revealScore(element);
        });

        if (element === scoreElement) {

            element.innerHTML = '';
            element.appendChild(revealButton);
        } else {

            scoreElement.style.display = 'none';
            element.insertBefore(revealButton, scoreElement.nextSibling);
        }

        element.classList.add('sat-score-hidden');
        element.style.cursor = 'pointer';
    }

    function revealScore(element, playSound = true, persist = true, playConfetti = true) {
        const originalScore = element.dataset.originalScore;
        if (originalScore) {
            if (persist && cachedPersistenceEnabled) {
                const scoreId = `${window.location.pathname}--${originalScore}`;
                chrome.storage.local.get('revealedScores', (data) => {
                    const revealedScores = data.revealedScores || [];
                    if (!revealedScores.includes(scoreId)) {
                        revealedScores.push(scoreId);
                        chrome.storage.local.set({
                            revealedScores
                        });
                    }
                });
            }

            if (element === (element.querySelector('.cb-roboto-light.cb-margin-right-8') || element.querySelector('[data-qc-id*="ds-"]') || element)) {

                element.innerHTML = element.dataset.originalContent;
                element.style.opacity = '0';
                element.style.display = '';
                setTimeout(() => {
                    element.style.transition = 'opacity 0.3s ease';
                    element.style.opacity = '1';
                }, 10);
            } else {

                element.innerHTML = element.dataset.originalContent;
                let scoreElement = element.querySelector('.cb-roboto-light.cb-margin-right-8') || element.querySelector('[data-qc-id*="ds-"]');
                if (scoreElement && scoreElement.style.display === 'none') {
                    scoreElement.style.display = '';
                }
            }

            const scoreElementToShow = element.querySelector('.cb-roboto-light.cb-margin-right-8') || element.querySelector('[data-qc-id*="ds-"]') || element;
            if (scoreElementToShow) {
                scoreElementToShow.style.setProperty('visibility', 'visible', 'important');
            }
            element.classList.remove('sat-score-hidden');
            element.classList.add('sat-score-revealed');
            element.style.cursor = 'default';

            const scoreNum = parseInt(originalScore, 10);
            const isWritingScore = scoreNum >= 2 && scoreNum <= 12;

            if (playSound && cachedAudioEnabled) {
                if (!audioPlayer.paused) {
                    audioPlayer.pause();
                    audioPlayer.currentTime = 0;
                }
                let soundSrc;
                if (isWritingScore) {
                    if (scoreNum >= 10) soundSrc = 'audio/Victory.mp3';
                    else if (scoreNum >= 8) soundSrc = 'audio/Success_Trumpet.mp3';
                    else if (scoreNum >= 6) soundSrc = 'audio/Disappointed_Spongebob.mp3';
                    else soundSrc = 'audio/Boom.mp3';
                } else {
                    const isTotalScore = scoreNum > 800 || element.closest('[data-qc-id*=":db-tot-score"]');
                    const thresholds = isTotalScore ? cachedSoundThresholds : cachedSectionSoundThresholds;
                    const threshold = thresholds.find(t => scoreNum >= t.min && scoreNum <= t.max);
                    if (threshold && threshold.sound) {
                        soundSrc = threshold.sound;
                    }
                }
                if (soundSrc) {
                    if (!soundSrc.startsWith('data:')) soundSrc = chrome.runtime.getURL(soundSrc);
                    audioPlayer.src = soundSrc;
                    const playPromise = audioPlayer.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => console.error("Error playing sound:", error));
                    }
                }
            }

            if (playConfetti && cachedConfettiEnabled && typeof shootConfetti === 'function') {
                let amount;
                if (isWritingScore) {
                    if (scoreNum >= 11) amount = 'high';
                    else if (scoreNum >= 8) amount = 'medium';
                    else if (scoreNum >= 6) amount = 'low';
                } else {
                    const isTotalScore = scoreNum > 800 || element.closest('[data-qc-id*=":db-tot-score"]');
                    const thresholds = isTotalScore ? cachedConfettiThresholds : cachedSectionConfettiThresholds;
                    const threshold = thresholds.find(t => scoreNum >= t.min && scoreNum <= t.max);
                    if (threshold) {
                        amount = threshold.amount;
                    }
                }
                if (amount) {
                    const scoreElement = element.querySelector('.cb-roboto-light.cb-margin-right-8') || element.querySelector('[data-qc-id*="ds-"]') || element;
                    const rect = scoreElement.getBoundingClientRect();
                    const confettiAmounts = {
                        low: {
                            particleCount: 50,
                            spread: 60
                        },
                        medium: {
                            particleCount: 100,
                            spread: 100
                        },
                        high: {
                            particleCount: 200,
                            spread: 160
                        }
                    };
                    const confettiOptions = confettiAmounts[amount] || confettiAmounts.medium;
                    shootConfetti(rect.left + (rect.width / 2), rect.top + (rect.height / 2), confettiOptions);
                }
            }
        }
    }

    function showAllScores() {
        const toPersist = [];
        document.querySelectorAll('.sat-score-hidden').forEach(element => {
            revealScore(element, false, false, false);
            const scoreId = `${window.location.pathname}--${element.dataset.originalScore}`;
            toPersist.push(scoreId);
        });
        if (cachedPersistenceEnabled && toPersist.length > 0) {
            chrome.storage.local.get('revealedScores', (data) => {
                const revealedScores = data.revealedScores || [];
                toPersist.forEach(id => {
                    if (!revealedScores.includes(id)) revealedScores.push(id);
                });
                chrome.storage.local.set({
                    revealedScores
                });
            });
        }
    }

    function hideAllScores() {
        if (!audioPlayer.paused) {
            audioPlayer.pause();
        }
        chrome.storage.local.set({
            revealedScores: []
        }, () => {

            document.querySelectorAll('[data-score-hider-processed="true"]').forEach(element => {

                const buttons = element.querySelectorAll('.sat-score-reveal-btn');
                buttons.forEach(button => button.remove());

                let scoreElement = element.querySelector('.cb-roboto-light.cb-margin-right-8') || element.querySelector('[data-qc-id*="ds-"]');
                if (!scoreElement) {

                    const elementText = element.textContent.trim();
                    if (/^\d+$/.test(elementText) && (parseInt(elementText) >= 400 && parseInt(elementText) <= 1600 || parseInt(elementText) >= 200 && parseInt(elementText) <= 800 || parseInt(elementText) >= 2 && parseInt(elementText) <= 8)) {
                        scoreElement = element;
                    }
                }

                if (scoreElement) {

                    const revealButton = document.createElement('button');
                    revealButton.className = 'sat-score-reveal-btn';
                    revealButton.innerHTML = `<span class="reveal-text">Click to reveal score</span>`;
                    revealButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        revealScore(element);
                    });

                    if (element === scoreElement) {

                        scoreElement.innerHTML = '';
                        scoreElement.appendChild(revealButton);
                    } else {

                        scoreElement.style.display = 'none';
                        element.insertBefore(revealButton, scoreElement.nextSibling);
                    }
                }
                element.classList.remove('sat-score-revealed');
                element.classList.add('sat-score-hidden');
                element.style.cursor = 'pointer';
            });
        });
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'showAll') showAllScores();
        else if (request.action === 'hideAll') hideAllScores();
        else if (request.action === 'getStatus') {
            const hiddenElements = document.querySelectorAll('.sat-score-hidden');
            const revealedElements = document.querySelectorAll('.sat-score-revealed');
            sendResponse({
                hiddenCount: hiddenElements.length,
                visibleCount: revealedElements.length,
                totalCount: hiddenElements.length + revealedElements.length
            });
        }
        return true;
    });

    function init() {

        setTimeout(hideScores, 500);
        setTimeout(hideScores, 1000);
        setTimeout(hideScores, 2000);
        setTimeout(hideScores, 3000);
        setTimeout(hideScores, 5000);

        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            mutations.forEach((m) => {
                if (m.type === 'childList' && m.addedNodes.length > 0) shouldCheck = true;
            });
            if (shouldCheck) setTimeout(hideScores, 200);
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            showAllScores();
        } else if (e.ctrlKey && e.shiftKey && e.key === 'H') {
            e.preventDefault();
            hideAllScores();
        }
    });

})();