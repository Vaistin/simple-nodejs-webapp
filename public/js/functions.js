//Render functions

function renderActorGrid(actors){
    const gridContainer = document.getElementById('actorGridContainer');
    actors.forEach(element => {
        const row = document.createElement('div');
        row.classList.add('row')

        for(var key in element){    
            const col = document.createElement('div');
            col.classList.add('col');
            col.innerHTML = `<i>${element[key]}</i>`;
            row.appendChild(col);
        }

        gridContainer.appendChild(row)
    });
}

function render_edit_form(actors, id_to_edit_inputed){
    const edit_form = document.getElementById('edit_form')
    let html_content = ``;
    actors.forEach(element => {
        if(element["ActorID"]===id_to_edit_inputed){
            html_content+=
            `First name: <input type="text" name="FirstName" value="${element["FirstName"]}" required><br><br>
            Last name: <input type="text" name="LastName" value="${element["LastName"]}" required><br><br>
            Gender:<br><br>
            <label for="M">Male</label>`;
            if(element["Gender"]==='M'){
                html_content+=`<input type="radio" name="Gender" id="M" value="M" checked><br>
                <label for="F">Female</label>
                <input type="radio" name="Gender" id="F" value="F"><br><br>`;
            }
            else{
                html_content+=`<input type="radio" name="Gender" id="M" value="M"><br>
                <label for="F">Female</label>
                <input type="radio" name="Gender" id="F" value="F" checked><br><br>`;
            }
            html_content+=`Number of Oscars: <input type="number" name="Oscar" value=${element["Oscar"]} required><br><br>
            <button type="submit">Submit</button>
            <input type="reset"><b><b>`;
        }
    });
    
    edit_form.innerHTML+=html_content;
}

async function renderFilteredActors(){
    const gridContainer = document.getElementById('actorGridContainer');
    gridContainer.innerHTML=``;

    const response = await fetch('/api/actorsSQL')
    const actors = await response.json()

    const sub_ActorID = document.getElementsByName('ActorID')[0].value;
    const sub_FirstName = document.getElementsByName('FirstName')[0].value;
    const sub_LastName = document.getElementsByName('LastName')[0].value;
    const sub_Gender = ()=>{
        if(document.getElementsByName('Gender')[0].checked)
            return 'M';
        else if(document.getElementsByName('Gender')[1].checked)
            return 'F';
        else
            return '';
    }
    const sub_Oscar = document.getElementsByName('Oscar')[0].value;

    for(let i=0; i<actors.length; ++i)
    {
        if((actors[i].ActorID != sub_ActorID) && sub_ActorID != '')
            continue;
        if((actors[i].FirstName != sub_FirstName) && sub_FirstName != '')
            continue;
        if((actors[i].LastName != sub_LastName) && sub_LastName != '')
            continue;
        if((actors[i].Gender != sub_Gender()) && sub_Gender() != '')
            continue;
        if((actors[i].Oscar != sub_Oscar) && sub_Oscar != '')
            continue;

        const row = document.createElement('div');
        row.classList.add('row')

        for(var key in actors[i]){    
            const col = document.createElement('div');
            col.classList.add('col');
            col.innerHTML = `<i>${actors[i][key]}</i>`;
            row.appendChild(col);
        }

        gridContainer.appendChild(row)
    }
    document.getElementById('grid_container').style.visibility='visible';
}

async function renderFilteredOscars(){
    const result = await fetch('/api/oscars')
    const oscars = await result.json()
    const gridContainer = document.getElementById('actorGridContainer');
    gridContainer.innerHTML=``;

    sub_ActorID = document.getElementsByName('ActorID')[0].value;
    sub_Year_recieved = document.getElementsByName('Year_recieved')[0].value;
    sub_Award = document.getElementsByName('Award')[0].value;
    
    for(let i=0; i<oscars.length; ++i)
    {
        if((sub_ActorID != oscars[i].ActorID) && sub_ActorID != '')
            continue;
        if((sub_Year_recieved != oscars[i].Year_recieved) && sub_Year_recieved != '')
            continue;
        if((sub_Award != oscars[i].Award) && sub_Award != '')
            continue;

        const row = document.createElement('div');
        row.classList.add('row')
    
        for(var key in oscars[i]){    
            const col = document.createElement('div');
            col.classList.add('col');
            col.innerHTML = `<i>${oscars[i][key]}</i>`;
            row.appendChild(col);
        }
    
        gridContainer.appendChild(row)
    }
    document.getElementById('grid_container').style.visibility='visible';
}

async function renderActorsByOscar(){
    const response = await fetch('/api/actors_oscars');
    const actors_oscars = await response.json();
    const gridContainer = document.getElementById('actorGridContainer');
    gridContainer.innerHTML=``;

    const sub_ActorID = document.getElementsByName('ActorID')[0].value;
    const sub_Year_recieved = document.getElementsByName('Year_recieved')[0].value;
    const sub_Award = document.getElementsByName('Award')[0].value;

    const ActorID_set = new Set();
    
    for(let i=0; i<actors_oscars.length; ++i)
    {
        if((sub_ActorID != actors_oscars[i].ActorID) && sub_ActorID != '')
            continue;
        if((sub_Year_recieved != actors_oscars[i].Year_recieved) && sub_Year_recieved != '')
            continue;
        if((sub_Award != actors_oscars[i].Award) && sub_Award != '')
            continue;
        if(ActorID_set.has(actors_oscars[i].ActorID))
            continue;
        else
            ActorID_set.add(actors_oscars[i].ActorID);

        const row = document.createElement('div');
        row.classList.add('row')
        const keys = ["ActorID", "FirstName", "LastName", "Gender", "Oscar"]
        keys.forEach(key => {    
            const col = document.createElement('div');
            col.classList.add('col');
            col.innerHTML = `<i>${actors_oscars[i][key]}</i>`;
            row.appendChild(col);
        });
        gridContainer.appendChild(row)
    }
    document.getElementById('grid_container').style.visibility='visible';
}

async function renderOscarsByActor(){
    const response = await fetch('/api/actors_oscars');
    const actors_oscars = await response.json();
    const gridContainer = document.getElementById('actorGridContainer');
    gridContainer.innerHTML=``;

    const sub_ActorID = document.getElementsByName('ActorID')[0].value;
    const sub_FirstName = document.getElementsByName('FirstName')[0].value;
    const sub_LastName = document.getElementsByName('LastName')[0].value;
    const sub_Gender = ()=>{
        if(document.getElementsByName('Gender')[0].checked)
            return 'M';
        else if(document.getElementsByName('Gender')[1].checked)
            return 'F';
        else
            return '';
    }
    const sub_Oscar = document.getElementsByName('Oscar')[0].value;
    
    for(let i=0; i<actors_oscars.length; ++i)
    {
        if((actors_oscars[i].ActorID != sub_ActorID) && sub_ActorID != '')
            continue;
        if((actors_oscars[i].FirstName != sub_FirstName) && sub_FirstName != '')
            continue;
        if((actors_oscars[i].LastName != sub_LastName) && sub_LastName != '')
            continue;
        if((actors_oscars[i].Gender != sub_Gender()) && sub_Gender() != '')
            continue;
        if((actors_oscars[i].Oscar != sub_Oscar) && sub_Oscar != '')
            continue;

        const row = document.createElement('div');
        row.classList.add('row')
        const keys = ["ActorID", "Year_recieved", "Award"]
        keys.forEach(key => {    
            const col = document.createElement('div');
            col.classList.add('col');
            col.innerHTML = `<i>${actors_oscars[i][key]}</i>`;
            row.appendChild(col);
        });
        gridContainer.appendChild(row)
    }
    document.getElementById('grid_container').style.visibility='visible';
}

async function renderCombinedSearch(){
    const response = await fetch('/api/actors_oscars');
    const actors_oscars = await response.json();
    const gridContainer = document.getElementById('actorGridContainer');
    gridContainer.innerHTML=``;

    const sub_ActorID = document.getElementsByName('ActorID')[0].value;
    const sub_FirstName = document.getElementsByName('FirstName')[0].value;
    const sub_LastName = document.getElementsByName('LastName')[0].value;
    const sub_Gender = () => {
        if(document.getElementsByName('Gender')[0].checked)
            return 'M';
        else if(document.getElementsByName('Gender')[1].checked)
            return 'F';
        else
            return '';
    }
    const sub_Oscar = document.getElementsByName('Oscar')[0].value;
    const sub_Year_recieved = document.getElementsByName('Year_recieved')[0].value;
    const sub_Award = document.getElementsByName('Award')[0].value;
    
    for(let i=0; i<actors_oscars.length; ++i)
    {
        if((actors_oscars[i].ActorID != sub_ActorID) && sub_ActorID != '')
            continue;
        if((actors_oscars[i].FirstName != sub_FirstName) && sub_FirstName != '')
            continue;
        if((actors_oscars[i].LastName != sub_LastName) && sub_LastName != '')
            continue;
        if((actors_oscars[i].Gender != sub_Gender()) && sub_Gender() != '')
            continue;
        if((actors_oscars[i].Oscar != sub_Oscar) && sub_Oscar != '')
            continue;
        if((actors_oscars[i].Year_recieved != sub_Year_recieved) && sub_Year_recieved != '')
            continue;
        if((actors_oscars[i].Award != sub_Award) && sub_Award != '')
            continue;

        const row = document.createElement('div');
        row.classList.add('row')
        for(key in actors_oscars[i])
        {    
            const col = document.createElement('div');
            col.classList.add('col');
            if(actors_oscars[i][key]!=null)
                col.innerHTML = `<i>${actors_oscars[i][key]}</i>`;
            row.appendChild(col);
        }
        gridContainer.appendChild(row)
    }
    document.getElementById('grid_container').style.visibility='visible';
}

//Event listeners

document.addEventListener('DOMContentLoaded', async()=>{
    try{
        if(document.getElementById('actorGridContainer')!==null){
            const DataSource = localStorage.getItem('DataSource')
            let response, actors;
            if(DataSource==='JSON')
            {
                response = await fetch('/api/actors')
                actors = await response.json()
            }
            else
            {
                response = await fetch('/api/actorsSQL')
                actors = await response.json()
            }
            renderActorGrid(actors)
        }

        if(document.getElementById('edit_form')!==null){
            let response;
            let actors;
            const id_to_edit = parseInt(document.getElementById('id_inputed').value);
            if(document.getElementById('DataSource').value === 'SQL')
            {
                response = await fetch('/api/actorsSQL')
                actors = await response.json()
            }
            else
            {
                response = await fetch('/api/actors')
                actors = await response.json()
            }
            render_edit_form(actors, id_to_edit)
        }
        const cb_Award = document.getElementsByName('Award')[0]
        if(cb_Award != null){
            response = await fetch('/api/oscars')
            oscars = await response.json()
            
            const choices = new Set();
            for(let i=0; i<oscars.length; ++i)
                if(choices.has(oscars[i].Award))
                    continue;
                else
                {
                    choices.add(oscars[i].Award);
                    const choice = document.createElement("option");
                    choice.value = oscars[i].Award;
                    choice.innerHTML=oscars[i].Award
                    cb_Award.appendChild(choice)
                }
        }
    }
    catch(error){
        console.log('Failed to execute event, ', error);
    }
})

//Support functions

async function ExistingID(id_to_check, DataSource){
    let response;
    let actors;
    console.log('Data Source iz ExistingID: ', DataSource);
    if(DataSource==='SQL')
    {
        try 
        {
            response = await fetch('/api/actorsSQL');
            actors = await response.json()
        }
        catch(err)
        {
            console.log('Error fetching data from SQL, ', err);
        }
    }
    else
    {
        try{
            response = await fetch('/api/actors')
            actors = await response.json()
        }
        catch(err){
            console.log(err);
        }
    }
    for(let i=0; i<actors.length; i++)
        if(actors[i].ActorID===id_to_check)
            return true;   
        else if(id_to_check<actors[i].ActorID)
            return false;
    return false;
};