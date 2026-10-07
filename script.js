const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-navigation');

if (menuToggle && navigation) {
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const formboldEndpoints = window.FORMBOLD_ENDPOINTS || {};
document.querySelectorAll('form[data-formbold-form]').forEach((form) => {
  const endpoint = formboldEndpoints[form.dataset.formboldForm];
  const submitButton = form.querySelector('button[type="submit"]');
  const connectionMessage = form.querySelector('.form-connection-message');
  let validEndpoint = false;

  if (endpoint) {
    try {
      const parsedEndpoint = new URL(endpoint);
      validEndpoint = parsedEndpoint.origin === 'https://formbold.com'
        && parsedEndpoint.pathname.startsWith('/s/');
    } catch {
      validEndpoint = false;
    }
  }

  if (validEndpoint) {
    form.action = endpoint;
    if (submitButton) submitButton.disabled = false;
    if (connectionMessage) connectionMessage.hidden = true;
  }
});

const enquiryForm = document.querySelector('.enquiry-form[action^="https://formbold.com/s/"]');
const submissionToast = document.querySelector('#submission-toast');

if (enquiryForm && submissionToast) {
  const submitButton = enquiryForm.querySelector('button[type="submit"]');
  const toastTitle = submissionToast.querySelector('#toast-title');
  const toastMessage = submissionToast.querySelector('#toast-message');
  const closeToast = submissionToast.querySelector('.toast-close');
  const originalButtonMarkup = submitButton?.innerHTML;
  let isSubmitting = false;
  let toastTimer;

  const hideToast = () => {
    submissionToast.hidden = true;
    window.clearTimeout(toastTimer);
  };

  const showToast = (title, message, isError = false) => {
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    submissionToast.classList.toggle('submission-toast--error', isError);
    submissionToast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 6000);
  };

  closeToast?.addEventListener('click', hideToast);

  enquiryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting || !enquiryForm.reportValidity()) return;

    isSubmitting = true;
    enquiryForm.setAttribute('aria-busy', 'true');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
    }

    try {
      const response = await fetch(enquiryForm.action, {
        method: 'POST',
        body: new FormData(enquiryForm),
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) throw new Error('FormBold rejected the enquiry.');

      enquiryForm.reset();
      showToast('Thank you', 'Your enquiry has been sent to GLC Law.');
    } catch {
      showToast('We couldn’t send that yet', 'Your details are still here. Please try again or call +44 7428 536201.', true);
    } finally {
      isSubmitting = false;
      enquiryForm.removeAttribute('aria-busy');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonMarkup;
      }
    }
  });
}

const counters = document.querySelectorAll('.hero .counter[data-count]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (counters.length && !reduceMotion) {
  const animateCounter = (counter) => {
    const target = Number(counter.dataset.count);
    const decimals = Number(counter.dataset.decimals || 0);
    const formatter = new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const duration = 1500;
    let startTime;

    const step = (now) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      counter.textContent = formatter.format(target * eased);
      if (progress < 1) requestAnimationFrame(step);
      else counter.textContent = formatter.format(target);
    };

    counter.textContent = formatter.format(0);
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.45 });
    counters.forEach((counter) => observer.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }
}
