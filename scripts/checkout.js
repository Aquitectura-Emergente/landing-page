document.addEventListener('DOMContentLoaded', function() {
    const t = (key, vars) => window.i18n.t(key, vars);

    // Solo Premium pasa por el checkout: Free se activa creando la cuenta y
    // Business se cotiza desde el formulario de contacto de la landing.
    // Los textos de cada plan viven en i18n/<idioma>.json bajo checkout.plans.<id>.
    const plans = [
        { id: 'premium', name: 'Premium', benefitCount: 4 }
    ];

    const state = {
        selectedPlanId: plans[0].id,
        step: 1,
        customer: {},
        billingEmail: '',
        processing: false
    };

    const planOptions = document.querySelector('[data-plan-options]');
    const stepPanels = document.querySelectorAll('[data-step]');
    const stepButtons = document.querySelectorAll('[data-step-button]');
    const selectedTypeLabels = document.querySelectorAll('[data-selected-type]');
    const customerForm = document.getElementById('customer-form');
    const paymentForm = document.getElementById('payment-form');
    const payButton = document.querySelector('[data-pay-now]');
    const payLabel = document.querySelector('[data-pay-label]');
    const confirmationMessage = document.querySelector('[data-confirmation-message]');
    const checkoutFlow = document.querySelector('.checkout-flow');

    function planText(plan, field) {
        return t(`checkout.plans.${plan.id}.${field}`);
    }

    function planBenefits(plan) {
        return Array.from({ length: plan.benefitCount }, (_, i) => planText(plan, `benefit${i + 1}`));
    }

    function formatPrice(plan) {
        return `${planText(plan, 'price')}${t('checkout.perMonth')}`;
    }

    function getSelectedPlan() {
        return plans.find(plan => plan.id === state.selectedPlanId) || plans[0];
    }

    function selectPlanRange(planId) {
        state.selectedPlanId = planId;
        renderPlanOptions();
        updateCartSummary();
    }

    function renderBenefits(list, items) {
        list.replaceChildren(...items.map(item => {
            const li = document.createElement('li');
            const icon = document.createElement('i');
            icon.className = 'fas fa-check';
            li.append(icon, item);
            return li;
        }));
    }

    function updateCartSummary() {
        const plan = getSelectedPlan();
        setText('[data-cart-name]', plan.name);
        setText('[data-cart-description]', planText(plan, 'description'));
        setText('[data-cart-type]', plan.name);
        setText('[data-cart-range]', planText(plan, 'segment'));
        setText('[data-cart-price]', formatPrice(plan));
        setText('[data-cart-total]', formatPrice(plan));
        setText('[data-confirmation-plan]', plan.name);
        setText('[data-confirmation-price]', formatPrice(plan));
        renderBenefits(document.querySelector('[data-cart-benefits]'), planBenefits(plan));
    }

    function setText(selector, text) {
        document.querySelectorAll(selector).forEach(element => {
            element.textContent = text;
        });
    }

    function renderPlanOptions() {
        selectedTypeLabels.forEach(label => {
            label.textContent = getSelectedPlan().name;
        });

        planOptions.innerHTML = plans.map(plan => `
            <article class="range-card ${plan.id === state.selectedPlanId ? 'selected' : ''}" data-plan-id="${plan.id}" tabindex="0">
                <h3>${plan.name}</h3>
                <p class="range">${planText(plan, 'segment')}</p>
                <div class="price">${planText(plan, 'price')}<span>${t('checkout.perMonth')}</span></div>
                <p>${planText(plan, 'description')}</p>
                <ul>
                    ${planBenefits(plan).map(item => `<li><i class="fas fa-check"></i>${item}</li>`).join('')}
                </ul>
            </article>
        `).join('');

        document.querySelectorAll('[data-plan-id]').forEach(card => {
            card.addEventListener('click', () => selectPlanRange(card.dataset.planId));
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectPlanRange(card.dataset.planId);
                }
            });
        });
    }

    function goToCheckoutStep(step) {
        if (step > state.step) {
            if (state.step === 1 && !state.selectedPlanId) return;
            if (state.step === 3 && !validateCustomerData()) return;
            if (state.step === 4 && !validatePaymentForm()) return;
        }

        state.step = Math.max(1, Math.min(5, step));
        stepPanels.forEach(panel => {
            panel.classList.toggle('active', Number(panel.dataset.step) === state.step);
        });
        stepButtons.forEach(button => {
            button.classList.toggle('active', Number(button.dataset.stepButton) === state.step);
        });
        const headerHeight = document.querySelector('.checkout-header') ? document.querySelector('.checkout-header').offsetHeight : 0;
        const flowTop = checkoutFlow ? checkoutFlow.offsetTop - headerHeight - 12 : 0;
        window.scrollTo({ top: Math.max(0, flowTop), behavior: 'smooth' });
    }

    function clearFormErrors(form) {
        form.querySelectorAll('.checkout-field').forEach(field => field.classList.remove('has-error'));
        form.querySelectorAll('small[data-error-for]').forEach(error => {
            error.textContent = '';
            delete error.dataset.errorKey;
        });
    }

    // Se guarda la clave del mensaje para volver a traducirlo si cambia el idioma
    function setFormError(form, name, key) {
        const input = form.elements[name];
        const error = form.querySelector(`[data-error-for="${name}"]`);
        if (input) input.closest('.checkout-field').classList.add('has-error');
        if (error) {
            error.dataset.errorKey = key;
            error.textContent = t(key);
        }
    }

    function validateCustomerData() {
        clearFormErrors(customerForm);
        const values = {
            customerName: customerForm.elements.customerName.value.trim(),
            customerEmail: customerForm.elements.customerEmail.value.trim(),
            customerPhone: customerForm.elements.customerPhone.value.trim(),
            customerType: customerForm.elements.customerType.value,
            installationAddress: customerForm.elements.installationAddress.value.trim()
        };
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let valid = true;

        if (!values.customerName) {
            setFormError(customerForm, 'customerName', 'checkout.errors.name');
            valid = false;
        }
        if (!emailPattern.test(values.customerEmail)) {
            setFormError(customerForm, 'customerEmail', 'checkout.errors.email');
            valid = false;
        }
        if (values.customerPhone.length < 7) {
            setFormError(customerForm, 'customerPhone', 'checkout.errors.phone');
            valid = false;
        }
        if (!values.installationAddress) {
            setFormError(customerForm, 'installationAddress', 'checkout.errors.address');
            valid = false;
        }

        if (valid) {
            state.customer = values;
            paymentForm.elements.billingEmail.value = values.customerEmail;
        }

        return valid;
    }

    function validatePaymentForm() {
        clearFormErrors(paymentForm);
        const values = {
            cardHolder: paymentForm.elements.cardHolder.value.trim(),
            cardNumber: paymentForm.elements.cardNumber.value.replace(/\D/g, ''),
            cardExpiry: paymentForm.elements.cardExpiry.value.trim(),
            cardCvv: paymentForm.elements.cardCvv.value.replace(/\D/g, ''),
            billingEmail: paymentForm.elements.billingEmail.value.trim()
        };
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let valid = true;

        if (!values.cardHolder) {
            setFormError(paymentForm, 'cardHolder', 'checkout.errors.cardHolder');
            valid = false;
        }
        if (values.cardNumber.length < 13) {
            setFormError(paymentForm, 'cardNumber', 'checkout.errors.cardNumber');
            valid = false;
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.cardExpiry)) {
            setFormError(paymentForm, 'cardExpiry', 'checkout.errors.cardExpiry');
            valid = false;
        }
        if (values.cardCvv.length < 3) {
            setFormError(paymentForm, 'cardCvv', 'checkout.errors.cardCvv');
            valid = false;
        }
        if (!emailPattern.test(values.billingEmail)) {
            setFormError(paymentForm, 'billingEmail', 'checkout.errors.billingEmail');
            valid = false;
        }

        if (valid) {
            state.billingEmail = values.billingEmail;
        }

        return valid;
    }

    function updatePayLabel() {
        payLabel.textContent = t(state.processing ? 'checkout.payment.processing' : 'checkout.payment.payNow');
    }

    function setPaymentProcessing(processing) {
        state.processing = processing;
        payButton.classList.toggle('is-loading', processing);
        payButton.disabled = processing;
        updatePayLabel();
        paymentForm.classList.toggle('is-processing', processing);
        paymentForm.querySelectorAll('input').forEach(input => {
            input.disabled = processing;
        });
    }

    function simulatePayment() {
        if (!validatePaymentForm()) return;
        setPaymentProcessing(true);
        setTimeout(() => {
            setPaymentProcessing(false);
            showConfirmation();
        }, 1800);
    }

    // El correo lo escribe el usuario: se inserta como texto, nunca como HTML
    function renderConfirmationMessage() {
        const email = state.billingEmail || state.customer.customerEmail || t('checkout.confirmation.yourEmail');
        const [before, after = ''] = t('checkout.confirmation.sent').split('{email}');
        const strong = document.createElement('strong');
        strong.textContent = email;
        confirmationMessage.replaceChildren(before, strong, after);
    }

    function showConfirmation() {
        renderConfirmationMessage();
        goToCheckoutStep(5);
    }

    function returnToLanding() {
        window.location.href = 'index.html';
    }

    function renderTexts() {
        renderPlanOptions();
        updateCartSummary();
        updatePayLabel();
        renderConfirmationMessage();
        document.querySelectorAll('[data-error-key]').forEach(error => {
            error.textContent = t(error.dataset.errorKey);
        });
    }

    document.querySelectorAll('[data-next-step]').forEach(button => {
        button.addEventListener('click', () => goToCheckoutStep(state.step + 1));
    });

    document.querySelectorAll('[data-prev-step]').forEach(button => {
        button.addEventListener('click', () => goToCheckoutStep(state.step - 1));
    });

    paymentForm.elements.cardNumber.addEventListener('input', function(event) {
        const digits = event.target.value.replace(/\D/g, '').slice(0, 16);
        event.target.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    });

    paymentForm.elements.cardExpiry.addEventListener('input', function(event) {
        const digits = event.target.value.replace(/\D/g, '').slice(0, 4);
        event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    });

    paymentForm.elements.cardCvv.addEventListener('input', function(event) {
        event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
    });

    payButton.addEventListener('click', simulatePayment);

    window.returnToLanding = returnToLanding;

    document.addEventListener('i18n:change', renderTexts);
    if (window.i18n.loaded) renderTexts();
    goToCheckoutStep(1);
});
