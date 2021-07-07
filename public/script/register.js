
const content = document.getElementById('content');
const form = document.getElementById('register-form');

// Since our server implemented the register process using API approach, we need to handle post request here.
form.addEventListener('submit', (e)=> {
    e.preventDefault();

    const formData = new FormData( e.target );

    if (formData.get('register_password') !== formData.get('register_confirm_password'))
        return appendMessageToForm('messageDanger', 'Password and Confirm Password Does not Match!');

    const body = new URLSearchParams();
    for (const entry of formData)
        body.append(entry[0], entry[1]);

    appendMessageToForm('messageWarning', 'Registration in progress... Please wait');

    fetch('/register', {
        method: "POST", 
        body: body
    }).then((res)=> res.json())
    .then((respond)=> {
        if (respond.error)
            return appendMessageToForm('messageDanger', respond.error);
        appendMessageToForm('messageSuccess', 'Successfully registered! Redirecting you to login page in a few seconds...');

        setTimeout(() => {
            window.location.replace('/login');
        }, 3000);
    });
});


function clearAlerts() {
    ['register-messageDanger', 'register-messageWarning', 'register-messageSuccess']
        .map((id)=> document.getElementById(id))
        .forEach((elem)=> {
            if (elem) elem.remove();
        });
}


function appendMessageToForm(type, message) {
    if (!['messageDanger', 'messageWarning', 'messageSuccess'].includes(type) )
        throw "Invalid argument 'type' in appendMessageToForm";

    //  Clear existing alert divs
    clearAlerts();

    const typeLower = type.substring(7).toLowerCase();
    
    //  Create the alert div depending on the type and message
    const textNode = document.createTextNode(message);
    const elem = document.createElement('div');
    elem.classList.add(type, 'alert', `alert-${typeLower}`, 'rounded-pill', 'mx-5');
    elem.id = `register-${type}`;
    elem.appendChild(textNode);

    content.insertBefore(elem, form);
}