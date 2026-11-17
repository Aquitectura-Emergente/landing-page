document.addEventListener('DOMContentLoaded', function() {
    // Solo Premium pasa por el checkout: Free se activa creando la cuenta y
    // Business se cotiza desde el formulario de contacto de la landing.
    const plans = [
        {
            id: 'premium',
            name: 'Premium',
            segment: 'Hogar',
            price: '14,90',
            description: 'Seguimiento completo de los niveles electromagnéticos de tu hogar.',
            benefits: ['Incluye todo lo del plan Free', 'Historial ilimitado', 'Recomendaciones personalizadas', 'Reportes descargables']
        }
    ];

    const state = {
        selectedPlanId: plans[0].id,
        step: 1,
        customer: {},
        billingEmail: ''
    };

    const planOptions = document.querySelector('[data-plan-options]');
    const stepPanels = document.querySelectorAll('[data-step]');
    const stepButtons = document.querySelectorAll('[data-step-button]');
    const selectedTypeLabels = document.querySelectorAll('[data-selected-type]');
    const customerForm = document.getElementById('customer-form');
    const paymentForm = document.getElementById('payment-form');
    const payButton = document.querySelector('[data-pay-now]');
    const checkoutFlow = document.querySelector('.checkout-flow');

    function formatPrice(plan) {
        return `S/ ${plan.price}/mes`;
    }

    function getSelectedPlan() {
        return plans.find(plan => plan.id === state.selectedPlanId) || plans[0];
    }

    function selectPlanRange(planId) {
        state.selectedPlanId = planId;
        renderPlanOptions();
        updateCartSummary();
    }

    function updateCartSummary() {
        const plan = getSelectedPlan();
        const benefits = plan.benefits.map(item => `<li><i class="fas fa-check"></i>${item}</li>`).join('');
        setText('[data-cart-name]', plan.name);
        setText('[data-cart-description]', plan.description);
        setText('[data-cart-type]', plan.name);
        setText('[data-cart-range]', plan.segment);
        setText('[data-cart-price]', formatPrice(plan));
        setText('[data-cart-total]', formatPrice(plan));
        setText('[data-confirmation-plan]', plan.name);
        setText('[data-confirmation-price]', formatPrice(plan));
        document.querySelector('[data-cart-benefits]').innerHTML = benefits;
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
                <p class="range">${plan.segment}</p>
                <div class="price">${formatPrice(plan).replace('/mes', '<span>/mes</span>')}</div>
                <p>${plan.description}</p>
                <ul>
                    ${plan.benefits.map(item => `<li><i class="fas fa-check"></i>${item}</li>`).join('')}
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
        });
    }

    function setFormError(form, name, message) {
        const input = form.elements[name];
        const error = form.querySelector(`[data-error-for="${name}"]`);
        if (input) input.closest('.checkout-field').classList.add('has-error');
        if (error) error.textContent = message;
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
            setFormError(customerForm, 'customerName', 'Ingresa el nombre completo.');
            valid = false;
        }
        if (!emailPattern.test(values.customerEmail)) {
            setFormError(customerForm, 'customerEmail', 'Ingresa un correo valido.');
            valid = false;
        }
        if (values.customerPhone.length < 7) {
            setFormError(customerForm, 'customerPhone', 'Ingresa un telefono valido.');
            valid = false;
        }
        if (!values.installationAddress) {
            setFormError(customerForm, 'installationAddress', 'Ingresa la direccion de instalacion.');
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
            setFormError(paymentForm, 'cardHolder', 'Ingresa el nombre del titular.');
            valid = false;
        }
        if (values.cardNumber.length < 13) {
            setFormError(paymentForm, 'cardNumber', 'Ingresa un numero de tarjeta valido.');
            valid = false;
        }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.cardExpiry)) {
            setFormError(paymentForm, 'cardExpiry', 'Usa el formato MM/AA.');
            valid = false;
        }
        if (values.cardCvv.length < 3) {
            setFormError(paymentForm, 'cardCvv', 'Ingresa un CVV de 3 o 4 digitos.');
            valid = false;
        }
        if (!emailPattern.test(values.billingEmail)) {
            setFormError(paymentForm, 'billingEmail', 'Ingresa un correo de facturacion valido.');
            valid = false;
        }

        if (valid) {
            state.billingEmail = values.billingEmail;
        }

        return valid;
    }

    function setPaymentProcessing(processing) {
        payButton.classList.toggle('is-loading', processing);
        payButton.disabled = processing;
        payButton.querySelector('span').textContent = processing ? 'Procesando pago...' : 'Pagar ahora';
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

    function showConfirmation() {
        const email = state.billingEmail || state.customer.customerEmail || 'tu correo';
        setText('[data-confirmation-email]', email);
        goToCheckoutStep(5);
    }

    function returnToLanding() {
        window.location.href = 'index.html';
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

    renderPlanOptions();
    updateCartSummary();
    goToCheckoutStep(1);
});
