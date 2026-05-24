create table code_masters (
  master varchar(100) not null,
  code varchar(100) not null,
  name varchar(100),
  sequence int8,
  status char(1),
  primary key (master, code)
);

create table companies (
  id varchar(80) primary key,
  slug varchar(255) unique,
  name varchar(255),
  overview character varying(3000),
  website character varying(255),
  industry varchar(100),
  size varchar(100),
  logo character varying(300),
  cover_url character varying(300),
  gallery character varying[],
  status char(1)
)
create table company_info (
  id varchar(40) primary key,
  follower_count bigint default 0,
  rate real default 0,
  rate1 integer default 0,
  rate2 integer default 0,
  rate3 integer default 0,
  rate4 integer default 0,
  rate5 integer default 0,
  count integer default 0,
  score integer default 0
);
create table company_followers (
  id varchar(40) not null,
  follower varchar(40) not null,
  followed_at timestamptz not null,
  primary key (id, follower)
);
create table company_following (
  id varchar(40) not null,
  following varchar(40) not null,
  following_at timestamptz not null,
  primary key (id, following)
);
create table company_rate_summary (
  id varchar(40) primary key,
  rate real default 0,
  rate1 integer default 0,
  rate2 integer default 0,
  rate3 integer default 0,
  rate4 integer default 0,
  rate5 integer default 0,
  count integer default 0,
  score integer default 0
);
create table company_rates (
  rate_id varchar(40) primary key,
  id varchar(40),
  author varchar(40) not null,
  rate float not null,
  time timestamptz,
  review text,
  useful_count integer default 0,
  reply_count integer default 0,
  histories jsonb[],
  anonymous boolean,
  unique (id, author)
);
create table company_rate_info (
  rate_id varchar(40) primary key,
  id varchar(40),
  author varchar(40) not null,
  rate float not null,
  time timestamptz,
  review text,
  useful_count integer default 0,
  reply_count integer default 0,
  histories jsonb[],
  anonymous boolean,
  unique (id, author)
);
create table company_rate1 (
  id varchar(40) primary key,
  rate real default 0,
  rate1 integer default 0,
  rate2 integer default 0,
  rate3 integer default 0,
  rate4 integer default 0,
  rate5 integer default 0,
  count integer default 0,
  score integer default 0
);
create table company_rate2 (
  id varchar(40) primary key,
  rate real default 0,
  rate1 integer default 0,
  rate2 integer default 0,
  rate3 integer default 0,
  rate4 integer default 0,
  rate5 integer default 0,
  count integer default 0,
  score integer default 0
);
create table company_rate3 (
  id varchar(40) primary key,
  rate real default 0,
  rate1 integer default 0,
  rate2 integer default 0,
  rate3 integer default 0,
  rate4 integer default 0,
  rate5 integer default 0,
  count integer default 0,
  score integer default 0
);
create table company_rate4 (
  id varchar(40) primary key,
  rate real default 0,
  rate1 integer default 0,
  rate2 integer default 0,
  rate3 integer default 0,
  rate4 integer default 0,
  rate5 integer default 0,
  count integer default 0,
  score integer default 0
);
create table company_rate5 (
  id varchar(40) primary key,
  rate real default 0,
  rate1 integer default 0,
  rate2 integer default 0,
  rate3 integer default 0,
  rate4 integer default 0,
  rate5 integer default 0,
  count integer default 0,
  score integer default 0
);
/*
insert into company_info (id,follower_count) values
  ('nab',1),
  ('fpt-software',2),
  ('tma-solutions',3),
  ('kbtg',3);
*/
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

insert into categories (id,name,status,path,resource_key,icon,sequence,type,parent) values ('companies','Companies','A','/companies','companies','work',11,'','');
insert into categories (id,name,status,path,resource_key,icon,sequence,type,parent) values ('news','News','A','/news','news','credit_card',21,'','');
insert into categories (id,name,status,path,resource_key,icon,sequence,type,parent) values ('jobs','Jobs','A','/jobs','jobs','work',31,'','');
insert into categories (id,name,status,path,resource_key,icon,sequence,type,parent) values ('profiles','Profiles','A','/profiles','profiles','work',41,'','');

update categories set version = 1;

insert into companies (id,slug,name,overview,website,industry,size,logo,cover_url,gallery,status) values
  ('tma-solutions','tma-solutions','TMA Solutions','TMA is a leading software company in Vietnam with 4,000 engineers and 28 years of experience in providing quality software services for clients in 30 countries. Besides 6 offices in Vietnam, TMA also has offices in Canada, USA, Japan, Australia, Germany and Singapore.','https://www.tmasolutions.com','Software Development','1,001-5,000 employees','https://cdn-images-1.medium.com/max/800/1*i6kcLjh6K7Gu07O7mbXzxA.jpeg','https://cdn-images-1.medium.com/max/800/1*HUq_nQPoayfFfPKLKRBQnQ.jpeg','{}','A'),
  ('fpt-software','fpt-software','FPT Software','FPT Software is a global technology and IT services provider headquartered in Vietnam, with USD 1.34 billion in revenue (2025) and over 33,000 employees in 30+ countries. Embracing an AI-first approach, FPT Software enables breakthrough speed, scalability and quality through AI-powered services and solutions and an AI-augmented workforce. It has partnered with over 1,100 clients worldwide, more than 130 of which are Fortune Global 500 companies in Aviation, Automotive, Banking, Financial Services and Insurance, Healthcare, Logistics, Manufacturing, Utilities, and more.','http://www.fptsoftware.com','IT Services and IT Consulting','10,001+ employees','https://cdn-images-1.medium.com/max/800/1*XbCE_KaYde8EOW8Ys1WSuQ.jpeg','https://cdn-images-1.medium.com/max/800/1*d6LjFkSg3MqO-4EPQpix0A.jpeg','{}','A'),
  ('kbtg','kbtg','KASIKORN Business-Technology Group','Established in 2016, KASIKORN Business-Technology Group is the technology arm of KASIKORNBANK (KBank), one of Thailand’s leading commercial banks. The organization consists of eight sub-companies, including K-Tech (a China-based fintech powerhouse) and KBTG Vietnam (extended IT arm and regional one-stop-service solution). By optimizing the capability in each area and collaborating harmoniously as one, KBTG diligently oversees more than 500 applications across KBank’s, KBTG’s, and K-Group’s ecosystems, with a commitment to make finance accessible, convenient, and inclusive for our customers across the region.','https://www.kbtg.tech','IT Services and IT Consulting','1,001-5,000 employees','https://cdn-images-1.medium.com/max/800/1*Z4k_onsvwMs4e0Oyvlvvgg.jpeg','https://cdn-images-1.medium.com/max/800/1*OTqlZAJHtlVogANXbsAs5A.jpeg','{}','A'),
  ('nab','nab','NAB','We''re here to be the most customer-centric company in Australia and New Zealand. We’re here to support you with your banking needs in any way we can. We’re open for business. ','http://www.nab.com.au','Banking','10,001+ employees','https://cdn-images-1.medium.com/max/800/1*NW3PXYNsjCWp8MiQXsA8mQ.jpeg','https://cdn-images-1.medium.com/max/800/1*7HHHAjXxT8jCg5IX_D96TA.jpeg','{}','A');
