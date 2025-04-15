const user_grid = document.getElementById('user_grid')
const manager_form = document.getElementById('manager_form')
const action_type = document.getElementById('action_type')

document.addEventListener('DOMContentLoaded', async() => {
    try{
        const result = await fetch('/api/users_search')
        const users = await result.json()
        renderUserGrid(users, '')
    }
    catch(err){
        console.log('Error in manage.js, DOMContentLoaded', err)
        return
    }
    //Event listener for the submit event of the manager form
    manager_form.addEventListener("submit", async (event) => {
        const errorMessage = document.getElementById('error_message');
        const username = document.getElementById('search_bar').value
        const result = await fetch('/api/user/'+username)
        const user = await result.json()
        if(user==null){
            console.log('Null result, move on')
            event.preventDefault();
            errorMessage.textContent = 'Action not possible';
            return;
        }    
    });
})


async function search_users(){
    const result = await fetch('/api/users_search')
    const users = await result.json()
    const search = document.getElementById('search_bar').value
    renderUserGrid(users, search)
}

function setActionType(actType){
    action_type.value = actType;
}

function renderUserGrid(users, search){
    user_grid.innerHTML = ``
    users.forEach(user => {
        const row = document.createElement('div')
        row.classList.add('row')

        for(var key in user) {
            const username = user["username"].substring(0, search.length)
            if(search === '' || search === username){
                const column = document.createElement('div')
                column.classList.add('col')
                column.innerText = user[key]
                row.appendChild(column)
            }
        }
        user_grid.appendChild(row)
    })
}