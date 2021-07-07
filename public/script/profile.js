
const content = document.getElementById('content');
const profile = document.getElementById('profile');
const userStatus = document.getElementById('profile__status');
const profilepic = document.getElementById('profile__avatar');
const chgProfilePicForm = document.getElementById('profile__chgProfilePic');
const chgProfilePicInput = document.getElementById('formFile');
const chgStatusForm = document.getElementById('profile__chgStatus');


// Since our server implemented the change status process using API approach, we need to handle post request here.
chgStatusForm.addEventListener('submit', (e)=> {
    e.preventDefault();

    // Construct form body, but if length is exceed 500, warn user in client side first
    const formData = new FormData(chgStatusForm);
    if (formData.get('profile__chgStatus').length > 500)
        return appendMessageToForm('messageDanger', 'New status too long. Do not exceed 500 characters');
    const body = new URLSearchParams();
    for (const entry of formData.entries())
        body.append(entry[0], entry[1]);


    fetch('/profile/changeStatus', {
        method: "POST",
        body: body
    }).then((res)=> res.json())
    .then((response)=> {
        console.log(response.error);
        if (response.error)
            return appendMessageToForm('messageDanger', response.error);
        appendMessageToForm('messageSuccess', 'Status successfully updated');

        userStatus.innerText = response.newStatus;
    });
});


// Our server also implement profile picture changing as API.
chgProfilePicForm.addEventListener('submit', (e)=> {
    e.preventDefault();

    // No files
    if (chgProfilePicInput.files.length === 0)
        return appendMessageToForm('messageDanger', 'Please select a profile picture to upload');

    const image = chgProfilePicInput.files[0];

    // Check file type
    if (!image.type.startsWith('image/'))
        return appendMessageToForm('messageDanger', 'Invalid file type! Profile picture must be an image!');
    // Check file size
    if (image.size > 5242880)
        return appendMessageToForm('messageDanger', 'Image too large! Make sure it is less than ~5MB');

    // Read as data url
    const reader = new FileReader();
    reader.onload = ()=> {
        // const body = new URLSearchParams();
        // body.append('profilePicUrl', reader.result);

        appendMessageToForm('messageWarning', 'Uploading new profile picture to the server...');

        fetch('/profile/changeProfilePic', {
            method: 'POST',
            body: new Blob( [reader.result], { type: 'text/plain' })
        }).then((res)=> res.json())
        .then((respond)=> {
            if (respond.error)
                return appendMessageToForm('messageDanger', respond.error);
            
            appendMessageToForm('messageSuccess', 'Profile picture successfully changed!');
            profilepic.src = reader.result;
        });
    };
    reader.readAsDataURL(image);
});



// Alerts
function clearAlerts() {
    ['profile-messageDanger', 'profile-messageWarning', 'profile-messageSuccess']
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
    elem.id = `profile-${type}`;
    elem.appendChild(textNode);

    content.insertBefore(elem, profile);

    setTimeout(() => {
        elem.remove();
    }, 6000);
}