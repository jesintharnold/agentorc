-- create extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- schema creation
create schema if not exists ORC;

-- -- task table
-- create table if not exists ORC.tasks (
--     ID UUID PRIMARY KEY NOT NULL,
--     JOB_ID UUID REFERENCES ORC.jobs(ID) ON DELETE CASCADE,
--     NAME VARCHAR(100) NOT NULL,
--     DESCRIPTION VARCHAR(200),
--     RETRY_COUNT INTEGER DEFAULT 0,
--     DEPENDS_ON UUID REFERENCES ORC.tasks(ID) DEFAULT NULL,
--     SCRIPT TEXT,
--     ENV JSONB DEFAULT NULL
-- )

	
-- job table
create table if not exists ORC.jobs (
    ID UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    NAME VARCHAR(100) NOT NULL,
    DESCRIPTION VARCHAR(500) NOT NULL, 
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    EXECORDER JSONB,
    TASKS JSONB NOT NULL
);

-- jobexecution
create table if not exists ORC.jobexecutions (
    ID UUID DEFAULT uuid_generate_v4() PRIMARY KEY, 
    JOB_ID UUID REFERENCES ORC.jobs(ID) ON DELETE CASCADE,
    STATE VARCHAR(10) NOT NULL,
    START_TIME TIMESTAMP NOT NULL,
    END_TIME TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--- Tasks
create table if not exists ORC.taskexecutions (
    ID UUID NOT NULL,
    JOB_EXC_ID UUID REFERENCES ORC.jobexecutions(ID) ON DELETE CASCADE,
    TASK_ID UUID NOT NULL,
    STATE VARCHAR(10) NOT NULL,
    START_TIME TIMESTAMP, 
    END_TIME TIMESTAMP,
    LOGS TEXT,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);