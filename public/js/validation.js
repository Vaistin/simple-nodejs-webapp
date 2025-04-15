const delete_form = document.getElementById('delete_form')
const edit_request_form = document.getElementById('edit_request_form')
const id_to_delete = document.getElementById('id_to_delete')
const DataSource = document.getElementById('DataSource')
const sign_up_form = document.getElementById('sign_up_form')

document.addEventListener('DOMContentLoaded', async()=>{
    if(delete_form!==null)
    {
        delete_form.addEventListener("submit", async (event) => {
            const errorMessage = document.getElementById('error_message');
            event.preventDefault();
            if (await ExistingID(parseInt(id_to_delete.value), DataSource.value)) {
                const actionUrl = delete_form.getAttribute('data-action');
                delete_form.setAttribute('action', actionUrl);
                delete_form.submit();
            }
            else
                errorMessage.textContent = 'Invalid actor ID';
        });
    }

    if(edit_request_form!==null)
    {
        edit_request_form.addEventListener("submit", async (event) => {
            const errorMessage = document.getElementById('error_message');
            event.preventDefault();
            if (await ExistingID(parseInt(id_to_edit.value), DataSource.value)) {
                errorMessage.textContent = ''
                edit_request_form.submit();
            }
            else
                errorMessage.textContent = 'Invalid actor ID';
        });
    }
})