https://sleepy-castle-98203.herokuapp.com/
# au_ru_bull_cow

Online implementation of game Bulls and Cows

### Building and running

#### Easy way:

`docker-compose up`

#### Specifying enviroment by hand:

Prerequirements: 
+ npm ^6
+ nodejs ^10
+ typescript: `npm install -g typescript`
+ mongodb

In order to run one must specify mongodb connection uri via `MONGODB_URI` enviroment value. for example 

`export MONGODB_URI="mongodb://localhost:27017/databe_name"`
