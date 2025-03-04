# survey

This is a fullstack survey application built with Node.js and Express as backend and react as frontend I used postgresql for my database. Follow the steps below to set up and run the project on your local machine.

git clone https://github.com/penguince/survey.git
cd survey

There are two sets of dependencies to install: one for the root directory and one for the server sub-directory.

npm install

cd server
npm install

Create a `.env` file in the `server` directory and add the necessary environment variables. Here is an example:
PORT=3000
DATABASE_URL=your_database_url
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass

Lastly to open you need to 2 seperate terminal
First one: on a new terminal 
cd terminal 
node index.js

Second one: on a new terminal
cd client
npm start 

make sure both front end and back end works correctly 