/**
 * Himanshu Jangid — Potfolie
 * 4-Page Atmospheric Engine: Dynamic Starfield, Cosmic Drift & Altitude Scroll Spy
 * Silky-Smooth 60/120 FPS Performance for Mobile & Laptop
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 0. DEVICE DETECTION
  // =========================================================================
  const isMobile = window.innerWidth < 768;

  // =========================================================================
  // 1. DYNAMIC STARFIELD & METEOR ENGINE (Mobile & Desktop)
  //    - Stars continuously drift through deep space with sinusoidal twinkling
  //    - Shooting stars (meteors) streak across the sky periodically
  //    - 60/120fps hardware-accelerated canvas loop
  // =========================================================================
  const canvas = document.getElementById('stars-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    
    const spaceEl = document.getElementById('space');
    const skitEl = document.getElementById('skit');
    
    function getCombinedUpperAtmosphereHeight() {
      if (spaceEl && skitEl) {
        return Math.max(spaceEl.offsetHeight + skitEl.offsetHeight, Math.round(window.innerHeight * 2));
      }
      return Math.round(window.innerHeight * 2.5);
    }

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = getCombinedUpperAtmosphereHeight());
    canvas.style.height = height + 'px';

    // Balanced star density for optimal 60/120fps
    const starCount = isMobile ? 40 : Math.min(130, Math.floor((width * height) / 7500));
    const stars = [];

    class Star {
      constructor() {
        this.originX = Math.random() * width;
        this.originY = Math.random() * (height * 0.95);
        this.x = this.originX;
        this.y = this.originY;
        this.radius = Math.random() * 1.3 + 0.45;
        this.baseAlpha = Math.random() * 0.65 + 0.35;
        this.alpha = this.baseAlpha;
        this.twinkleSpeed = Math.random() * 0.02 + 0.008;
        this.twinkleOffset = Math.random() * Math.PI * 2;

        // Subtle micro-motion around its own place (NO falling like snow)
        this.swayRadiusX = Math.random() * 4.0 + 1.5;
        this.swayRadiusY = Math.random() * 3.5 + 1.2;
        this.swaySpeedX = Math.random() * 0.014 + 0.005;
        this.swaySpeedY = Math.random() * 0.014 + 0.005;
        this.phaseX = Math.random() * Math.PI * 2;
        this.phaseY = Math.random() * Math.PI * 2;

        this.calcAltitudeFade();
      }

      calcAltitudeFade() {
        const fadeStart = height * 0.45;
        const fadeEnd = height * 0.95;
        if (this.originY <= fadeStart) {
          this.altitudeFade = 1.0;
        } else if (this.originY >= fadeEnd) {
          this.altitudeFade = 0;
        } else {
          const ratio = (this.originY - fadeStart) / (fadeEnd - fadeStart);
          this.altitudeFade = Math.pow(1.0 - ratio, 1.5);
        }
      }

      update(time) {
        // Dynamic sinusoidal twinkling
        this.alpha = this.baseAlpha + Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.28;
        if (this.alpha < 0.1) this.alpha = 0.1;
        if (this.alpha > 1) this.alpha = 1;

        // Gentle swaying on its own coordinate (hovering like real stars)
        this.x = this.originX + Math.sin(time * this.swaySpeedX + this.phaseX) * this.swayRadiusX;
        this.y = this.originY + Math.cos(time * this.swaySpeedY + this.phaseY) * this.swayRadiusY;
      }

      draw() {
        const finalAlpha = this.alpha * this.altitudeFade;
        if (finalAlpha > 0.02) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha})`;
          ctx.fill();
        }
      }
    }

    for (let i = 0; i < starCount; i++) {
      stars.push(new Star());
    }

    // Occasional shooting star / meteor
    class ShootingStar {
      constructor() {
        this.active = false;
        this.reset();
      }

      reset() {
        this.active = false;
        this.x = Math.random() * (width * 0.75) + width * 0.1;
        this.y = Math.random() * (height * 0.35);
        this.length = Math.random() * 70 + 45;
        this.speed = Math.random() * 6 + 5.5;
        this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.25;
        this.dx = Math.cos(this.angle) * this.speed;
        this.dy = Math.sin(this.angle) * this.speed;
        this.alpha = 1.0;
        this.fade = Math.random() * 0.016 + 0.012;
      }

      spawn() {
        this.reset();
        this.active = true;
      }

      update(dtNorm = 1) {
        if (!this.active) return;
        this.x += this.dx * dtNorm;
        this.y += this.dy * dtNorm;
        this.alpha -= this.fade * dtNorm;
        if (this.alpha <= 0 || this.y > height * 0.45 || this.x > width) {
          this.active = false;
        }
      }

      draw() {
        if (!this.active || this.alpha <= 0) return;
        const tailX = this.x - Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;

        const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.7, `rgba(186, 230, 253, ${this.alpha * 0.6})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${this.alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fill();
      }
    }

    const shootingStar = new ShootingStar();
    let meteorTimer = 0;

    // Fast scroll detection: pause canvas rendering during active touch scroll
    let isFastScrolling = false;
    let scrollStopTimer = null;

    window.addEventListener('scroll', () => {
      isFastScrolling = true;
      clearTimeout(scrollStopTimer);
      scrollStopTimer = setTimeout(() => {
        isFastScrolling = false;
      }, 100);
    }, { passive: true });

    // High Refresh Rate (60Hz & 120Hz ProMotion) decoupled animation loop
    let lastTimestamp = performance.now();
    let simTime = 0;
    let isVisible = true;

    
    // Interactive Constellation Gravity on Cursor
    let mouseStarX = -1000;
    let mouseStarY = -1000;
    let isMouseOnCanvas = false;

    if (!isMobile) {
      window.addEventListener('mousemove', (e) => {
        const scrollY = window.scrollY || window.pageYOffset || 0;
        mouseStarX = e.clientX;
        mouseStarY = e.clientY + scrollY;
        isMouseOnCanvas = (mouseStarY >= 0 && mouseStarY <= height);
      }, { passive: true });

      document.addEventListener('mouseleave', () => {
        isMouseOnCanvas = false;
      });
    }

    function renderStarfield(now) {
      if (!now) now = performance.now();

      // When fast-scrolling on mobile, yield 100% GPU to native scroll compositor
      if (isMobile && isFastScrolling) {
        lastTimestamp = now;
        requestAnimationFrame(renderStarfield);
        return;
      }

      if (isVisible) {
        // Delta time normalized to standard 60fps base (16.667ms per frame)
        // On 120Hz displays, dtNorm is ~0.5; on 60Hz displays, dtNorm is ~1.0
        const dtMs = Math.min(now - lastTimestamp, 100);
        lastTimestamp = now;
        const dtNorm = dtMs / 16.6667;
        simTime += dtNorm;

        ctx.clearRect(0, 0, width, height);

        // Update and draw drifting stars with sub-frame interpolation
        for (let i = 0; i < stars.length; i++) {
          stars[i].update(simTime);
          stars[i].draw();
        }

        // Interactive Celestial Constellations near Cursor (Subtle & Natural Stargazing)
        if (isMouseOnCanvas && mouseStarY < height * 0.9) {
          const maxDist = 120;
          const nearby = [];
          for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            if (star.altitudeFade > 0.05) {
              const dx = star.x - mouseStarX;
              const dy = star.y - mouseStarY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < maxDist) {
                nearby.push({ star: star, dist: dist });
              }
            }
          }

          // Connect stars to cursor
          for (let i = 0; i < nearby.length; i++) {
            const s1 = nearby[i].star;
            const alphaToCursor = (1 - (nearby[i].dist / maxDist)) * 0.35 * s1.altitudeFade;
            if (alphaToCursor > 0.02) {
              ctx.beginPath();
              ctx.moveTo(mouseStarX, mouseStarY);
              ctx.lineTo(s1.x, s1.y);
              ctx.strokeStyle = 'rgba(186, 230, 253, ' + alphaToCursor.toFixed(3) + ')';
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }

            // Connect nearby stars to each other (Celestial Constellation Network)
            for (let j = i + 1; j < nearby.length; j++) {
              const s2 = nearby[j].star;
              const dStarX = s1.x - s2.x;
              const dStarY = s1.y - s2.y;
              const starDist = Math.sqrt(dStarX * dStarX + dStarY * dStarY);
              if (starDist < 95) {
                const lineAlpha = (1 - (starDist / 95)) * 0.25 * Math.min(s1.altitudeFade, s2.altitudeFade);
                if (lineAlpha > 0.02) {
                  ctx.beginPath();
                  ctx.moveTo(s1.x, s1.y);
                  ctx.lineTo(s2.x, s2.y);
                  ctx.strokeStyle = 'rgba(147, 197, 253, ' + lineAlpha.toFixed(3) + ')';
                  ctx.lineWidth = 0.6;
                  ctx.stroke();
                }
              }
            }
          }
        }

        // Shooting star delta-time scaling
        if (shootingStar.active) {
          shootingStar.update(dtNorm);
          shootingStar.draw();
        } else {
          meteorTimer += dtNorm;
          if (meteorTimer > 380 && Math.random() < 0.03 * dtNorm) {
            shootingStar.spawn();
            meteorTimer = 0;
          }
        }
      } else {
        lastTimestamp = now;
      }
      requestAnimationFrame(renderStarfield);
    }
    requestAnimationFrame(renderStarfield);

    // Smart pause only when scrolled deep into Earth section (saves battery)
    window.addEventListener('scroll', () => {
      const shouldBeVisible = window.scrollY < window.innerHeight * 2.5;
      if (shouldBeVisible !== isVisible) {
        isVisible = shouldBeVisible;
      }
    }, { passive: true });

    // Dynamic resize handler
    function handleResize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = getCombinedUpperAtmosphereHeight();
      canvas.style.height = height + 'px';
      stars.forEach(s => s.calcAltitudeFade());
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 200);
    }, { passive: true });
    
    // Also re-measure after assets finish loading
    window.addEventListener('load', handleResize, { passive: true });
  }

  // =========================================================================
  // 2. DYNAMIC ALTITUDE THEME DETECTOR (Throttled BoundingRect Scroll Spy)
  // =========================================================================
  const header = document.getElementById('main-nav');
  const sections = [
    { id: 'space', element: document.getElementById('space'), theme: 'theme-space' },
    { id: 'skit', element: document.getElementById('skit'), theme: 'theme-skit' },
    { id: 'sky', element: document.getElementById('sky'), theme: 'theme-sky' },
    { id: 'earth', element: document.getElementById('earth'), theme: 'theme-earth' }
  ];
  const navPills = document.querySelectorAll('.alt-link');

  let activeTheme = '';
  let activeSectionId = '';

  function updateAltitudeTheme() {
    const triggerY = window.innerHeight * 0.45;
    let targetTheme = 'theme-space';
    let targetSectionId = 'space';

    for (let i = 0; i < sections.length; i++) {
      const el = sections[i].element;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= triggerY && rect.bottom > triggerY) {
          targetTheme = sections[i].theme;
          targetSectionId = sections[i].id;
          break;
        }
      }
    }

    if (targetTheme !== activeTheme) {
      activeTheme = targetTheme;
      if (header) {
        header.classList.remove('theme-space', 'theme-skit', 'theme-sky', 'theme-earth');
        header.classList.add(activeTheme);
      }
    }

    if (targetSectionId !== activeSectionId) {
      activeSectionId = targetSectionId;
      navPills.forEach(pill => {
        if (pill.getAttribute('data-target') === activeSectionId) {
          pill.classList.add('active-pill');
        } else {
          pill.classList.remove('active-pill');
        }
      });
    }
  }

  let scrollTicking = false;
  let lastSpyCheck = 0;
  window.addEventListener('scroll', () => {
    const now = performance.now();
    if (!scrollTicking && (now - lastSpyCheck > 75)) {
      scrollTicking = true;
      window.requestAnimationFrame(() => {
        updateAltitudeTheme();
        lastSpyCheck = performance.now();
        scrollTicking = false;
      });
    }
  }, { passive: true });

  updateAltitudeTheme();

  // =========================================================================
  // 3. SMOOTH PROGRAMMATIC NAVIGATION
  // =========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Ensure all liquid-reveal elements are visible
  document.querySelectorAll('.liquid-reveal').forEach(el => el.classList.add('revealed'));


  // =========================================================================
  // PROFESSIONAL TOP-BAR NANO LASER CONTROLLER (IDEA 1)
  // Smooth acceleration (0% -> 100% in ~450ms) -> instant graceful curtain dissolve
  // =========================================================================
  const curtainEl = document.getElementById('top-loader-curtain');
  const barEl = document.getElementById('top-loader-bar');

  if (curtainEl && barEl) {
    let isDismissed = false;

    function setProgress(percent) {
      barEl.style.width = Math.min(percent, 100) + '%';
    }

    // Micro-acceleration timeline (0% -> 100% in ~420ms)
    setTimeout(() => setProgress(35), 40);
    setTimeout(() => setProgress(72), 160);
    setTimeout(() => setProgress(92), 300);

    function dismissLoader() {
      if (isDismissed) return;
      isDismissed = true;
      setProgress(100);
      setTimeout(() => {
        curtainEl.classList.add('loader-hidden');
        setTimeout(() => {
          if (curtainEl && curtainEl.parentNode) {
            curtainEl.remove();
          }
        }, 400);
      }, 120);
    }

    if (document.readyState === 'complete') {
      setTimeout(dismissLoader, 420);
    } else {
      window.addEventListener('load', () => {
        setTimeout(dismissLoader, 350);
      });
      setTimeout(dismissLoader, 650); // Hard fallback safety cap
    }
  }


  // =========================================================================
  // LIVE GITHUB CONTRIBUTIONS ENGINE & HEATMAP RE-RENDERER
  // Fetches fresh commits, updates counter & re-renders SVG cells in real-time
  // =========================================================================
  function bindGitTooltips() {
    const tooltip = document.getElementById('git-tooltip');
    const cells = document.querySelectorAll('#git-heatmap-cells rect');

    if (tooltip && cells.length > 0) {
      cells.forEach(cell => {
        cell.addEventListener('mouseenter', (e) => {
          const count = cell.getAttribute('data-count') || '0';
          const dateStr = cell.getAttribute('data-date') || '';
          let formattedDate = dateStr;
          if (dateStr) {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const m = parseInt(parts[1], 10) - 1;
              formattedDate = months[m] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
            }
          }
          tooltip.textContent = (count === '0' ? 'No' : count) + ' contributions on ' + formattedDate;
          
          const rect = cell.getBoundingClientRect();
          tooltip.style.left = (rect.left + rect.width / 2) + 'px';
          tooltip.style.top = (rect.top - 6) + 'px';
          tooltip.style.opacity = '1';
        });

        cell.addEventListener('mouseleave', () => {
          tooltip.style.opacity = '0';
        });
      });
    }
  }

  function getCellAttrs(level) {
    switch (level) {
      case 1:
        return { fill: '#064e3b', stroke: '#047857', glow: false };
      case 2:
        return { fill: '#059669', stroke: '#10b981', glow: false };
      case 3:
        return { fill: '#0284c7', stroke: '#38bdf8', glow: true };
      case 4:
        return { fill: '#06b6d4', stroke: '#67e8f9', glow: true };
      default:
        return { fill: '#1e293b', stroke: 'rgba(255,255,255,0.06)', glow: false };
    }
  }

  function syncLiveGithub() {
    fetch('https://github-contributions-api.jogruber.de/v4/1Himanshu-Jangid?y=last')
      .then(r => r.json())
      .then(data => {
        if (!data) return;
        if (data.total && typeof data.total.lastYear === 'number') {
          const totalEl = document.getElementById('github-total-contrib');
          if (totalEl) totalEl.textContent = data.total.lastYear;
        }

        if (Array.isArray(data.contributions) && data.contributions.length > 0) {
          const cellsGroup = document.getElementById('git-heatmap-cells');
          if (cellsGroup) {
            let svgHtml = '';
            data.contributions.forEach((day, index) => {
              const weekIndex = Math.floor(index / 7);
              const dayOfWeek = index % 7;
              const x = 28 + weekIndex * 13;
              const y = 18 + dayOfWeek * 13;
              const style = getCellAttrs(day.level);
              const glowClass = style.glow ? ' class="git-cell-glow"' : '';
              svgHtml += '<rect x="' + x + '" y="' + y + '" width="10" height="10" rx="2" fill="' + style.fill + '" stroke="' + style.stroke + '" stroke-width="0.7"' + glowClass + ' data-date="' + day.date + '" data-count="' + day.count + '"><title>' + day.count + ' contributions on ' + day.date + '</title></rect>';
            });
            cellsGroup.innerHTML = svgHtml;
            bindGitTooltips();
          }
        }
      })
      .catch(() => {
        // Fallback gracefully to pre-rendered cells
      });
  }

  bindGitTooltips();
  syncLiveGithub();


  // =========================================================================
  // COPY EMAIL WITH APPLE LIQUID GLASS TOAST
  // =========================================================================
  const copyBtn = document.getElementById('copy-email-btn');
  const copyToast = document.getElementById('copy-toast');
  if (copyBtn) {
    copyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = copyBtn.getAttribute('data-email') || '1himanshujangid@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        const copyIcon = document.getElementById('copy-icon');
        const checkIcon = document.getElementById('check-icon');
        if (copyIcon && checkIcon) {
          copyIcon.classList.add('hidden');
          checkIcon.classList.remove('hidden');
        }
        if (copyToast) {
          copyToast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
          copyToast.classList.add('opacity-100', 'translate-y-0');
        }
        setTimeout(() => {
          if (copyIcon && checkIcon) {
            copyIcon.classList.remove('hidden');
            checkIcon.classList.add('hidden');
          }
          if (copyToast) {
            copyToast.classList.remove('opacity-100', 'translate-y-0');
            copyToast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
          }
        }, 2200);
      }).catch(() => {
        // Fallback mailto
        window.location.href = 'mailto:' + email;
      });
    });
  }


  // =========================================================================
  // APPLE LIQUID GLASS CONTACT MODAL ENGINE (Approach 2 - Enhanced Delivery Engine)
  // =========================================================================
  const contactModal = document.getElementById('contact-modal');
  const contactCard = document.getElementById('contact-modal-card');
  const openModalBtn = document.getElementById('open-contact-modal-btn');
  const closeModalBtn = document.getElementById('close-contact-modal-btn');
  const doneModalBtn = document.getElementById('done-contact-btn');
  const activationDoneBtn = document.getElementById('activation-done-btn');
  const contactForm = document.getElementById('direct-contact-form');
  const formContainer = document.getElementById('contact-form-container');
  const successContainer = document.getElementById('contact-success-container');
  const activationContainer = document.getElementById('contact-activation-container');
  const activationGmailLink = document.getElementById('activation-gmail-link');
  const openGmailWebBtn = document.getElementById('open-gmail-web-btn');
  const errorMsg = document.getElementById('contact-error-msg');
  const submitBtn = document.getElementById('submit-contact-btn');
  const btnText = document.getElementById('btn-text');
  const btnIcon = document.getElementById('btn-icon');
  const btnSpinner = document.getElementById('btn-spinner');

  function openModal() {
    if (contactModal) {
      contactModal.classList.add('modal-active');
      document.body.style.overflow = 'hidden';
      const nameInput = document.getElementById('contact-name');
      if (nameInput) setTimeout(() => nameInput.focus(), 150);
    }
  }

  function closeModal() {
    if (contactModal) {
      contactModal.classList.remove('modal-active');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (formContainer) formContainer.classList.remove('hidden');
        if (successContainer) successContainer.classList.add('hidden');
        if (activationContainer) activationContainer.classList.add('hidden');
        if (contactForm) contactForm.reset();
        if (errorMsg) errorMsg.classList.add('hidden');
      }, 300);
    }
  }

  if (openModalBtn) openModalBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (doneModalBtn) doneModalBtn.addEventListener('click', closeModal);
  if (activationDoneBtn) activationDoneBtn.addEventListener('click', closeModal);

  // Close when clicking on backdrop outside card
  if (contactModal && contactCard) {
    contactModal.addEventListener('click', (e) => {
      if (!contactCard.contains(e.target)) {
        closeModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && contactModal && contactModal.classList.contains('modal-active')) {
      closeModal();
    }
  });

  // Direct Gmail Web button
  function getGmailComposeUrl(name, email, message) {
    const subject = encodeURIComponent('Portfolio Inquiry from ' + (name || 'Visitor'));
    const body = encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message);
    return 'https://mail.google.com/mail/?view=cm&fs=1&to=1himanshujangid@gmail.com&su=' + subject + '&body=' + body;
  }

  if (openGmailWebBtn) {
    openGmailWebBtn.addEventListener('click', () => {
      const name = document.getElementById('contact-name')?.value.trim() || 'Visitor';
      const email = document.getElementById('contact-email')?.value.trim() || '';
      const message = document.getElementById('contact-message')?.value.trim() || '';
      const gmailUrl = getGmailComposeUrl(name, email, message);
      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    });
  }

  // Handle Form Submission
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('contact-name')?.value.trim();
      const email = document.getElementById('contact-email')?.value.trim();
      const message = document.getElementById('contact-message')?.value.trim();

      if (!name || !email || !message) {
        if (errorMsg) {
          errorMsg.textContent = 'Please fill out all required fields.';
          errorMsg.classList.remove('hidden');
        }
        return;
      }

      // Set Loading UI
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.textContent = 'Transmitting...';
      if (btnIcon) btnIcon.classList.add('hidden');
      if (btnSpinner) btnSpinner.classList.remove('hidden');
      if (errorMsg) errorMsg.classList.add('hidden');

      try {
        const response = await fetch('https://formsubmit.co/ajax/1himanshujangid@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            message: message,
            _subject: 'New Portfolio Message from ' + name,
            _template: 'table'
          })
        });

        const data = await response.json();

        // 1. Check if FormSubmit requires initial one-time activation
        if (data && data.message && data.message.toLowerCase().includes('activation')) {
          if (formContainer) formContainer.classList.add('hidden');
          if (activationContainer) {
            activationContainer.classList.remove('hidden');
            if (activationGmailLink) {
              activationGmailLink.href = getGmailComposeUrl(name, email, message);
            }
          }
        } else if (response.ok && (data.success === 'true' || data.success === true)) {
          // 2. Direct success: Email arrived in inbox
          if (formContainer && successContainer) {
            formContainer.classList.add('hidden');
            successContainer.classList.remove('hidden');
          }
        } else {
          // 3. Fallback: Open Gmail Web / mailto
          const gmailUrl = getGmailComposeUrl(name, email, message);
          window.open(gmailUrl, '_blank', 'noopener,noreferrer');
          if (formContainer && successContainer) {
            formContainer.classList.add('hidden');
            successContainer.classList.remove('hidden');
          }
        }
      } catch (err) {
        // Fallback on network/CSP error to Gmail Web
        const gmailUrl = getGmailComposeUrl(name, email, message);
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');
        if (formContainer && successContainer) {
          formContainer.classList.add('hidden');
          successContainer.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Transmit Directly';
        if (btnIcon) btnIcon.classList.remove('hidden');
        if (btnSpinner) btnSpinner.classList.add('hidden');
      }
    });
  }

});
