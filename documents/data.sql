create table code_masters (
  master varchar(100) not null,
  code varchar(100) not null,
  name varchar(100),
  sequence int8,
  status char(1),
  primary key (master, code)
);

create table users (
  id varchar(40) primary key,
  username varchar(255) not null,
  email varchar(255) not null,
  phone character varying(45),
  gender character(1),
  date_of_birth timestamp with time zone,
  display_name varchar(255),
  given_name character varying(100),
  family_name character varying(100),
  middle_name character varying(100),
  status char(1) not null,
  image_url varchar(500),
  cover_url varchar(500),
  headline character varying(500),
  bio character varying(3000),
  website character varying(255),
  occupation character varying(255),
  company character varying(255),
  location character varying(255),
  interests character varying[],
  skills jsonb[],
  achievements jsonb[],
  works jsonb[],
  educations jsonb[],
  settings jsonb,
  language varchar(5),
  dateformat varchar(12),
  max_password_age integer
);
create table passwords (
  id varchar(40) primary key,
  password varchar(255),
  success_time timestamptz,
  fail_time timestamptz,
  fail_count integer,
  locked_until_time timestamptz,
  changed_time timestamptz,
  history character varying[]
);
create table passcodes (
  id varchar(40) primary key,
  code varchar(500) not null,
  expired_at timestamptz not null
);

create table user_info (
  id varchar(40) primary key,
  follower_count bigint default 0,
  following_count bigint default 0
);
create table user_followers (
  id varchar(40) not null,
  follower varchar(40) not null,
  followed_at timestamptz not null,
  primary key (id, follower)
);
create table user_following (
  id varchar(40) not null,
  following varchar(40) not null,
  following_at timestamptz not null,
  primary key (id, following)
);

create table skills (
  skill varchar(120) primary key
);
create table interests (
  interest varchar(120) primary key
);

insert into skills (skill) values
  ('Angular'),
  ('Azure'),
  ('Apigee'),
  ('AWS'),
  ('C'),
  ('C++'),
  ('CICD'),
  ('Data'),
  ('GO'),
  ('Google Cloud'),
  ('IOT'),
  ('Java'),
  ('Javascript'),
  ('Kotlin'),
  ('Management'),
  ('Microservices'),
  ('nodejs'),
  ('PHP'),
  ('Python'),
  ('Reactjs'),
  ('Salesforce'),
  ('Swift'),
  ('Typescript');

insert into interests (interest) values
  ('Blockchain'),
  ('Cloud'),
  ('Data'),
  ('Fintech'),
  ('IOT'),
  ('Mobile'),
  ('Open source'),
  ('Outsourcing'),
  ('Web');

insert into code_masters(master, code, name, sequence, status) values ('language','en','English',1,'A');
insert into code_masters(master, code, name, sequence, status) values ('language','vi','Tiếng Việt',2,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','yyyy/M/d','yyyy/M/d',1,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','yyyy/MM/dd','yyyy/MM/dd',2,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','yyyy-M-d','yyyy-M-d',3,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','yyyy-MM-dd','yyyy-MM-dd',4,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','yyyy.MM.dd','yyyy.MM.dd',5,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','yy.MM.dd','yy.MM.dd',6,'I');
insert into code_masters(master, code, name, sequence, status) values ('date_format','d/M/yyyy','d/M/yyyy',7,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','d/MM/yyyy','d/MM/yyyy',8,'I');
insert into code_masters(master, code, name, sequence, status) values ('date_format','dd/MM/yyyy','dd/MM/yyyy',9,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','dd/MM yyyy','dd/MM yyyy',10,'I');
insert into code_masters(master, code, name, sequence, status) values ('date_format','dd/MM/yy','dd/MM/yy',11,'I');
insert into code_masters(master, code, name, sequence, status) values ('date_format','d-M-yyyy','d-M-yyyy',12,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','dd-MM-yyyy','dd-MM-yyyy',13,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','dd-MM-yy','dd-MM-yy',14,'I');
insert into code_masters(master, code, name, sequence, status) values ('date_format','d.M.yyyy','d.M.yyyy',15,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','d.MM.yyyy','d.MM.yyyy',16,'I');
insert into code_masters(master, code, name, sequence, status) values ('date_format','dd.MM.yyyy','dd.MM.yyyy',17,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','dd.MM.yy','dd.MM.yy',18,'I');
insert into code_masters(master, code, name, sequence, status) values ('date_format','M/d/yyyy','M/d/yyyy',19,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','MM/dd/yyyy','MM/dd/yyyy',20,'A');
insert into code_masters(master, code, name, sequence, status) values ('date_format','MM.dd.yyyy','MM.dd.yyyy',21,'A');

/*
alter table user_roles add foreign key (user_id) references users (user_id);
alter table user_roles add foreign key (role_id) references roles (role_id);

alter table modules add foreign key (parent) references modules (module_id);

alter table role_modules add foreign key (role_id) references roles (role_id);
alter table role_modules add foreign key (module_id) references modules (module_id);

drop table modules;
drop table users;
drop table roles;
drop table user_roles;
drop table role_modules;
drop table audit_logs;
*/

create table categories (
  id varchar(40) primary key,
  name varchar(255) not null,
  status char(1) not null,
  path varchar(255),
  resource_key varchar(255),
  icon varchar(255),
  sequence int not null,
  type varchar(40),
  parent varchar(40),
  created_by varchar(40),
  created_at timestamptz,
  updated_by varchar(40),
  updated_at timestamptz,
  version integer
);
/*
news => dynamic
jobs => dynamic
profiles => dynamic
*/

insert into categories (id,name,status,path,resource_key,icon,sequence,type,parent) values ('news','News','A','/news','news','credit_card',1,'','');
insert into categories (id,name,status,path,resource_key,icon,sequence,type,parent) values ('jobs','Jobs','A','/jobs','jobs','work',11,'','');
insert into categories (id,name,status,path,resource_key,icon,sequence,type,parent) values ('profiles','Profiles','A','/profiles','profiles','work',21,'','');

update categories set version = 1;
