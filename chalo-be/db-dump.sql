--
-- PostgreSQL database dump
--

\restrict vZcjRjYNyl9EEH0uVWjuoc8LKMUhqI4TB1X1le48fuXZszaFj3yK3I9oTKA7RIS

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.pager_tokens DROP CONSTRAINT IF EXISTS "FK_pager_tokens_order";
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS "FK_orders_pager";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "FK_ff56834e735fa78a15d0cf21926";
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS "FK_f1d359a55923bb45b057fbdab0d";
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS "FK_cdb99c05982d5191ac8465ac010";
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS "FK_2a7fdd7af437285a3ef0fc8b64f";
DROP INDEX IF EXISTS public."UQ_pager_tokens_active_number";
DROP INDEX IF EXISTS public."IDX_pager_tokens_status";
DROP INDEX IF EXISTS public."IDX_pager_tokens_order_id";
DROP INDEX IF EXISTS public."IDX_pager_tokens_number";
DROP INDEX IF EXISTS public."IDX_orders_pager_id";
DROP INDEX IF EXISTS public."IDX_ff56834e735fa78a15d0cf2192";
DROP INDEX IF EXISTS public."IDX_a0ce9094eaceeaeb21c328cfc8";
DROP INDEX IF EXISTS public."IDX_7618ff18516cbf928b15dc337b";
DROP INDEX IF EXISTS public."IDX_33c02ffdcef9fbca050414f71b";
DROP INDEX IF EXISTS public."IDX_2a7fdd7af437285a3ef0fc8b64";
DROP INDEX IF EXISTS public."IDX_1f4b9818a08b822a31493fdee9";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "UQ_fe0bb3f6520ee0469504521e710";
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS "UQ_0fc85221960b588e27d825c4abd";
ALTER TABLE IF EXISTS ONLY public.pager_tokens DROP CONSTRAINT IF EXISTS "PK_pager_tokens";
ALTER TABLE IF EXISTS ONLY public.app_settings DROP CONSTRAINT IF EXISTS "PK_app_settings";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "PK_a3ffb1c0c8416b9fc6f907b7433";
ALTER TABLE IF EXISTS ONLY public.migrations DROP CONSTRAINT IF EXISTS "PK_8c82d7f526340ab734260ea46be";
ALTER TABLE IF EXISTS ONLY public.tables DROP CONSTRAINT IF EXISTS "PK_7cf2aca7af9550742f855d4eb69";
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS "PK_710e2d4957aa5878dfe94e4ac2f";
ALTER TABLE IF EXISTS ONLY public.checkout_sessions DROP CONSTRAINT IF EXISTS "PK_5730b2bbc190203a94941d82bd1";
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS "PK_24dbc6126a28ff948da33e97d3b";
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS "PK_0806c755e0aca124e67c0cf6d7d";
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS "PK_005269d8574e6fac0493715c308";
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.migrations ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.tables;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.pager_tokens;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.order_items;
DROP SEQUENCE IF EXISTS public.migrations_id_seq;
DROP TABLE IF EXISTS public.migrations;
DROP TABLE IF EXISTS public.checkout_sessions;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.app_settings;
DROP TYPE IF EXISTS public.users_role_enum;
DROP TYPE IF EXISTS public.tables_status_enum;
DROP TYPE IF EXISTS public.products_status_enum;
DROP TYPE IF EXISTS public.pager_tokens_status_enum;
DROP TYPE IF EXISTS public.orders_status_enum;
DROP TYPE IF EXISTS public.checkout_sessions_status_enum;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: checkout_sessions_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.checkout_sessions_status_enum AS ENUM (
    'PENDING',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: orders_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.orders_status_enum AS ENUM (
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: pager_tokens_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pager_tokens_status_enum AS ENUM (
    'WAITING',
    'ASSIGNED',
    'COMPLETED'
);


--
-- Name: products_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.products_status_enum AS ENUM (
    'AVAILABLE',
    'UNAVAILABLE',
    'OUT_OF_STOCK'
);


--
-- Name: tables_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tables_status_enum AS ENUM (
    'AVAILABLE',
    'OCCUPIED'
);


--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.users_role_enum AS ENUM (
    'ADMIN',
    'MODERATOR',
    'CUSTOMER'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: app_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_settings (
    id integer DEFAULT 1 NOT NULL,
    "waitTimeEnabled" boolean DEFAULT true NOT NULL,
    "baristaCount" integer DEFAULT 3 NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "bankBin" character varying(6),
    "bankAccountNo" character varying(30),
    "bankAccountName" character varying(100),
    CONSTRAINT "CHK_app_settings_singleton" CHECK ((id = 1))
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "imageUrl" character varying(500),
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: checkout_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checkout_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "tableToken" character varying(255) NOT NULL,
    "tableId" uuid NOT NULL,
    "orderIds" json NOT NULL,
    "totalAmount" integer NOT NULL,
    status public.checkout_sessions_status_enum DEFAULT 'PENDING'::public.checkout_sessions_status_enum NOT NULL,
    "clientSecret" character varying(64) NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "orderId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    "productName" character varying(100) NOT NULL,
    "productImageUrl" character varying(500),
    price integer NOT NULL,
    quantity integer NOT NULL,
    subtotal integer NOT NULL,
    note text
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "tableId" uuid NOT NULL,
    "tableToken" character varying(255) NOT NULL,
    status public.orders_status_enum DEFAULT 'PENDING'::public.orders_status_enum NOT NULL,
    "paidStatus" boolean DEFAULT false NOT NULL,
    "totalAmount" integer NOT NULL,
    "estimatedWaitMinutes" integer,
    note text,
    "paymentRequested" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "pagerId" uuid
);


--
-- Name: pager_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pager_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    number integer NOT NULL,
    status public.pager_tokens_status_enum DEFAULT 'ASSIGNED'::public.pager_tokens_status_enum NOT NULL,
    "orderId" uuid,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "categoryId" uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "imageUrl" character varying(500),
    price integer NOT NULL,
    "prepTime" integer DEFAULT 5 NOT NULL,
    status public.products_status_enum DEFAULT 'AVAILABLE'::public.products_status_enum NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: tables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tables (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    area character varying(100),
    status public.tables_status_enum DEFAULT 'AVAILABLE'::public.tables_status_enum NOT NULL,
    "qrToken" character varying(255) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL,
    "fullName" character varying(100) NOT NULL,
    avatar character varying(500),
    role public.users_role_enum DEFAULT 'MODERATOR'::public.users_role_enum NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "currentRefreshTokenHash" text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_settings (id, "waitTimeEnabled", "baristaCount", "updatedAt", "bankBin", "bankAccountNo", "bankAccountName") FROM stdin;
1	t	3	2026-07-16 16:40:06.120675	970422	0123456789	CHALO COFFEE
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, description, "imageUrl", "sortOrder", "isActive", "createdAt") FROM stdin;
a08562ea-6b6b-4140-a07b-baba6405947c	Coffee	Menu Coffee	\N	1	t	2026-07-05 16:29:01.943329
7b469355-2c50-48d7-85b3-0c938df17423	Matcha	Menu Matcha	\N	2	t	2026-07-05 16:29:01.943329
aed08d71-3e23-4645-869d-6cfb7848f9e3	Trai Cay Tuoi	Menu Trai Cay Tuoi	\N	4	t	2026-07-05 16:29:01.943329
99eb9832-8f6a-4abc-967e-56f0d2b71dd1	Sua Chua	Menu Sua Chua	\N	5	t	2026-07-05 16:29:01.943329
17552de5-13ce-4aa3-881d-4f2295e68878	Do An Vat	Menu Do An Vat	\N	6	t	2026-07-05 16:29:01.943329
2ae31b5b-dd97-4f90-85a0-38ac16378717	Trà đậm vị - Trà sữa	Menu Tra Dam Vi - Tra Sua		3	t	2026-07-05 16:29:01.943329
\.


--
-- Data for Name: checkout_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checkout_sessions (id, "tableToken", "tableId", "orderIds", "totalAmount", status, "clientSecret", "expiresAt", "createdAt", "updatedAt") FROM stdin;
8bc94e9f-a7e5-4e12-8444-e68c270eee5e	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["ecb2be8a-e60b-4035-878a-995a019b47ec","95b939d9-e39e-40c7-8d4d-9685d093555f","4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8","349e7821-dac8-4606-bff3-5f544297634f","ba16f164-c6ab-45a1-b9b1-9742a40623d9","6ff51ca2-2234-49f0-8ea8-845ff604863c"]	1197000	PENDING	a74f3f5fed68cb66f658feb57a68fb0f6d1d9c9567435649	2026-07-05 17:23:00.862+00	2026-07-05 17:08:00.854495	2026-07-05 17:08:00.854495
99ac5cc0-0131-4fe5-a68b-62aaab864446	5d1b20d2-27ad-437d-b941-38345b4e492a	f47c34e9-69bc-4fac-ae25-a36dba679b53	["65838b50-e04a-4b3b-a297-a4ef47a46eac","29d38982-e17f-4221-a657-1c7e0d15e747","6b503c28-27d0-4ccf-b283-f09595b0ad8b","968e2fab-fa28-4561-9a29-8ab489799199","2fa5104d-d411-47dc-8163-1f24d2794383"]	1031000	PENDING	55e1f5b82901451a0ca89a2268f2d2dd1dbc711a4d7adf3c	2026-07-05 17:25:08.039+00	2026-07-05 17:10:08.031661	2026-07-05 17:10:08.031661
c2204a21-450a-4850-9eee-1951e9fd0b51	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["ecb2be8a-e60b-4035-878a-995a019b47ec","95b939d9-e39e-40c7-8d4d-9685d093555f","4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8","349e7821-dac8-4606-bff3-5f544297634f","ba16f164-c6ab-45a1-b9b1-9742a40623d9","6ff51ca2-2234-49f0-8ea8-845ff604863c","5759b194-5e3f-4205-ae9f-5cdf25beb086","5c941b65-aff4-4e8c-b423-a4108b64dcaf"]	1314000	PENDING	0b23d48ff00eaa7569587a56500be4861fa35d9206675c78	2026-07-05 17:41:49.477+00	2026-07-05 17:26:49.469496	2026-07-05 17:26:49.469496
6f6b2af8-c99a-4182-bf6a-f1b1134343b0	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["ecb2be8a-e60b-4035-878a-995a019b47ec","95b939d9-e39e-40c7-8d4d-9685d093555f","4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8","349e7821-dac8-4606-bff3-5f544297634f","ba16f164-c6ab-45a1-b9b1-9742a40623d9","6ff51ca2-2234-49f0-8ea8-845ff604863c","5759b194-5e3f-4205-ae9f-5cdf25beb086","5c941b65-aff4-4e8c-b423-a4108b64dcaf","d83e9ace-7d1b-4bd4-83b2-482914acbba7"]	1392000	PENDING	c6b204300390ab8edbf18920a67ea2385102f799040d3522	2026-07-05 17:44:28.873+00	2026-07-05 17:29:28.868598	2026-07-05 17:29:28.868598
ba8664bf-576a-4bd3-a7bd-9152a635d1ff	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["ecb2be8a-e60b-4035-878a-995a019b47ec","95b939d9-e39e-40c7-8d4d-9685d093555f","4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8","349e7821-dac8-4606-bff3-5f544297634f","ba16f164-c6ab-45a1-b9b1-9742a40623d9","6ff51ca2-2234-49f0-8ea8-845ff604863c","5759b194-5e3f-4205-ae9f-5cdf25beb086","5c941b65-aff4-4e8c-b423-a4108b64dcaf","d83e9ace-7d1b-4bd4-83b2-482914acbba7","15adfb8d-c2e8-4b93-a193-e0ac14d16023"]	1470000	PENDING	4c1ce53c2fe6312cd60551464506d603154487ff41c8fbc0	2026-07-05 17:44:46.103+00	2026-07-05 17:29:46.092857	2026-07-05 17:29:46.092857
de57ea7b-57dd-480d-903f-5a237a95a629	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["ecb2be8a-e60b-4035-878a-995a019b47ec","95b939d9-e39e-40c7-8d4d-9685d093555f","4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8","349e7821-dac8-4606-bff3-5f544297634f","ba16f164-c6ab-45a1-b9b1-9742a40623d9","6ff51ca2-2234-49f0-8ea8-845ff604863c","5759b194-5e3f-4205-ae9f-5cdf25beb086","5c941b65-aff4-4e8c-b423-a4108b64dcaf","d83e9ace-7d1b-4bd4-83b2-482914acbba7","15adfb8d-c2e8-4b93-a193-e0ac14d16023","bcf6d649-bfa2-4d32-b722-f61706b781e1"]	1509000	PENDING	3ee987941b01e9b5301ca8df6d6bd1227d4dc828c719fc42	2026-07-05 17:50:22.212+00	2026-07-05 17:35:22.207998	2026-07-05 17:35:22.207998
e7a3f0a8-59b1-43a9-9e8a-a1a9108ff494	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["ecb2be8a-e60b-4035-878a-995a019b47ec","95b939d9-e39e-40c7-8d4d-9685d093555f","4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8","349e7821-dac8-4606-bff3-5f544297634f","ba16f164-c6ab-45a1-b9b1-9742a40623d9","6ff51ca2-2234-49f0-8ea8-845ff604863c","5759b194-5e3f-4205-ae9f-5cdf25beb086","5c941b65-aff4-4e8c-b423-a4108b64dcaf","d83e9ace-7d1b-4bd4-83b2-482914acbba7","15adfb8d-c2e8-4b93-a193-e0ac14d16023","bcf6d649-bfa2-4d32-b722-f61706b781e1","8761ae61-e5cb-44c1-97a0-701ed2990d65"]	1548000	COMPLETED	4583ad5ce2ecb0c7095946d05cf0e4ddfb2e3a09f87d4ab2	2026-07-05 17:50:51.818+00	2026-07-05 17:35:51.81304	2026-07-05 17:35:52.0026
a6016a85-8d67-4ec2-83f5-3af6501dda7a	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["61394c6e-87b7-4fda-b2df-6a28ab095401"]	78000	COMPLETED	43ca3ee0f29fc160ee7e93c0799cc492f5983d4c7db4d1a3	2026-07-05 17:53:32.517+00	2026-07-05 17:38:32.51038	2026-07-05 17:38:32.610456
f048149d-ca16-43e9-924c-dff0fe769327	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["ed049976-9c3c-4b37-8853-2c12b6fc9ddb"]	78000	COMPLETED	e2566292b99d07ff9550b2612f7ef9c510d6b3b876a5eb44	2026-07-05 19:20:54.271+00	2026-07-05 19:05:54.262849	2026-07-05 19:05:54.429412
a14c5214-4551-4387-accb-2f7081329998	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["5b930741-c3b3-4c2d-98dc-d61a94d06bf0"]	78000	COMPLETED	330fd36189ab5012eb247684a01c924d390a01a87eaf4ed4	2026-07-05 19:25:21.906+00	2026-07-05 19:10:21.900532	2026-07-05 19:10:22.017075
6d1c3809-2a37-47eb-bdd1-adcd0fa4730d	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["39554379-a87a-43bf-8e80-91c7fa5be89f"]	78000	COMPLETED	a9fa4d1c6c168a02d7802c7967c5a898ad0beccee0a21a14	2026-07-05 19:27:44.227+00	2026-07-05 19:12:44.221753	2026-07-05 19:12:44.317907
afccea65-37e9-4d51-915c-ed76d894505d	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["50614198-1ede-41d4-8dff-32d11f2ef472","016cec69-8553-4609-a5e8-2c0edb2dc073"]	117000	COMPLETED	f8d49515512fc979dd6d611952e9e785c06ff99f97a73a27	2026-07-05 22:52:19.701+00	2026-07-05 22:37:19.696127	2026-07-05 22:37:19.757606
2a315563-2d85-4f8d-8955-5f07e2685faa	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["9c3fdd21-3faa-4f6b-b113-3493bfee3d61","1e120cf9-6388-48a3-ba9e-23be93b8c716","a3d9f414-15b5-4d7a-adb0-b96fe01f6306"]	156000	COMPLETED	ce354dab3ca2d0bbf5d14af2fa4afdeb84f0ac15dbc16ef5	2026-07-07 12:21:00.029+00	2026-07-07 12:06:00.019386	2026-07-07 12:06:00.138261
ba3db6d4-6594-42db-8d9d-eabf5528d07d	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["6ffeb4d9-c11a-4145-9e9c-b21b19528343","983511e4-f27a-4be0-a300-9aa95bf62cc0","7bc70f63-16b8-4803-9492-7e75215bbf9c"]	195000	COMPLETED	065e502b6e347bbd86834290026905dfd6958f47b997feea	2026-07-07 12:24:37.556+00	2026-07-07 12:09:37.546955	2026-07-07 12:09:37.649224
3df8a5ad-65fa-4705-8fd7-c9dc81217eac	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["94cebf0b-d35c-44d9-b2e3-8ecffc35d91d"]	78000	COMPLETED	99775063762f40d779491bf1f294bfed0cc0afe12d07419e	2026-07-07 12:34:38.501+00	2026-07-07 12:19:38.485399	2026-07-07 12:19:38.738072
aa533ecb-9210-4d41-9012-d6b3ae6ad95a	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["8a6c1b35-a3ef-4b41-b7b1-43d17901d308"]	78000	COMPLETED	23b88702cd77412165cdca84df964329c747c2f6e18e1664	2026-07-16 14:52:35.346+00	2026-07-16 14:37:35.325923	2026-07-16 14:37:35.721456
37a1997b-283f-4ce1-9fb4-94088b272e70	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["08b631c7-29e7-449e-845e-8030363a1e79"]	78000	COMPLETED	2d3f497894e2d1fc42e0e3ab78488a3f42e84fde22c8c8b5	2026-07-16 14:54:55.433+00	2026-07-16 14:39:55.420854	2026-07-16 14:39:55.958515
17aa3e02-05d6-4f51-b3ee-c5d0a56412c0	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["3cd3229c-72f1-4a56-9508-acdf23e7b4c6"]	78000	COMPLETED	13017b86caa2f0f9ed666bc185f44fd079826899e4ce8125	2026-07-16 15:44:46.32+00	2026-07-16 15:29:46.290178	2026-07-16 15:29:46.515318
48186546-5fb0-4cf6-b170-54127a77adc7	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["4b23a795-0ea5-432e-9935-107a8f104b91"]	78000	COMPLETED	d4c5eb945173ca3cbd192d6b4918d117de1a255fda130eed	2026-07-16 15:48:38.997+00	2026-07-16 15:33:38.986851	2026-07-16 15:33:39.205793
427c0721-281f-4ef5-b65e-36b17ca8e85e	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["1751d5e5-0ed9-41b1-ba87-42a02ec0ba10"]	78000	COMPLETED	19437ab0d9e2226a6f972bcbb6bfc293e4c822c6d5765930	2026-07-16 15:49:51.705+00	2026-07-16 15:34:51.692829	2026-07-16 15:34:51.992953
96991565-9255-4759-8b08-79a8de361cb9	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["5776a0f0-2a19-4e96-a5a2-6c292f4ac2ef"]	78000	COMPLETED	0dc385ba9ddb41b75f8d1d4d20030536aaff9495b4f91e67	2026-07-16 16:28:34.765+00	2026-07-16 16:13:34.750737	2026-07-16 16:13:34.992517
26797cbb-aaca-4d52-8d03-6c2ab89614aa	417713ee-1c17-44ff-bd50-6f006d31025b	6f6931a7-1baf-41b2-aadb-773ca0e51d02	["b2ccc084-07f8-4619-a146-0b8d3c9a2d46"]	78000	COMPLETED	a35518169c9086cfcb27955394b7696c0c83e0e3719a4718	2026-07-16 16:55:00.179+00	2026-07-16 16:40:00.163454	2026-07-16 16:40:00.462641
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
3	1736150400000	AddCheckoutSessions1736150400000
4	1736150500000	AddPaidOrderStatus1736150500000
5	1736150600000	AddOrderPaidStatus1736150600000
6	1736150700000	AddCustomerRole1736150700000
7	1736150800000	AddAppSettings1736150800000
8	1736150900000	AddPagerTokens1736150900000
9	1752640000000	AddBankSettings1752640000000
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, "orderId", "productId", "productName", "productImageUrl", price, quantity, subtotal, note) FROM stdin;
c78553ee-d2fb-4139-baa0-b2bf3fb7aaff	ecb2be8a-e60b-4035-878a-995a019b47ec	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	it da
454c237e-6f5c-4dc2-b824-ff7069a36623	65838b50-e04a-4b3b-a297-a4ef47a46eac	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	2	78000	\N
b8b99941-716b-4ae4-ad99-1f17ae21f38b	65838b50-e04a-4b3b-a297-a4ef47a46eac	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	3	144000	\N
d933e721-cdab-423b-9c5b-e9af1d5bdc49	51af2375-a636-46b7-8ac3-04bd850f1657	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	3	102000	\N
cacba7b4-30f9-481f-9710-fb543f4a5577	51af2375-a636-46b7-8ac3-04bd850f1657	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	1	39000	\N
4e5450bf-6173-4b8a-98b1-9fc1c19b743f	51af2375-a636-46b7-8ac3-04bd850f1657	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	2	96000	\N
aa69749e-43fb-4538-9f5b-e569c9d53f05	82b6c6e8-bfae-4abf-8ae5-82bd2b01ae18	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	1	48000	\N
ebc019ab-b6d2-460a-abb5-b1a300d82103	82b6c6e8-bfae-4abf-8ae5-82bd2b01ae18	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	2	78000	\N
43e99062-0b03-4a5b-9bc2-4df2ce71b27a	82b6c6e8-bfae-4abf-8ae5-82bd2b01ae18	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	3	144000	\N
3b5796c4-5445-4bb5-9717-76735f157833	82b6c6e8-bfae-4abf-8ae5-82bd2b01ae18	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	1	54000	\N
181f4735-3344-43ba-a894-3909412f90f4	22aa16d9-33ff-4244-87e2-8c0737e3ffcb	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	2	78000	\N
1513362f-cb22-4ee9-9727-0983e5b97a99	b319fa81-059b-4829-aa97-d9c2c124a665	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	3	135000	\N
eecc6ae0-2754-4cd3-95da-9d3580037510	b319fa81-059b-4829-aa97-d9c2c124a665	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	1	39000	\N
bb3570c0-538a-425c-afc2-697d0712b829	c85b4dda-ecec-4b35-8480-e28b2bd4971a	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	1	55000	\N
1a60e2d7-c6b4-4e95-b9c3-bb2c7d1e7348	c85b4dda-ecec-4b35-8480-e28b2bd4971a	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	2	96000	\N
a0f7cf2d-1bcc-4a80-ab27-faea0c673d0a	c85b4dda-ecec-4b35-8480-e28b2bd4971a	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	3	24000	\N
90fdf448-42df-41a9-b8b5-64b66abad00e	1c1c7b7c-1d34-44dd-bacd-7c20b59fc087	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	2	96000	\N
7607a457-98a4-48ac-a485-32ca7857c9c9	1c1c7b7c-1d34-44dd-bacd-7c20b59fc087	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	3	117000	\N
d65b4608-f463-49d1-ae39-9e5179c8bbae	1c1c7b7c-1d34-44dd-bacd-7c20b59fc087	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
1b655096-6350-4771-9a6f-9623dc72f09b	1c1c7b7c-1d34-44dd-bacd-7c20b59fc087	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	2	68000	\N
f64733ce-ea16-4548-b30d-fed3ab1e07e5	dd1b4022-399a-437f-bbe7-a729fa97c20f	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	3	117000	\N
c497a41f-a995-4a19-8635-08fdc7cc8c45	c28ecb74-46df-4957-95aa-742cce5577a2	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	1	15000	it da
d94f9f4f-128f-49ea-81f3-bbcab04676cd	c28ecb74-46df-4957-95aa-742cce5577a2	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	2	58000	\N
afcf0ed8-537d-4484-bae8-411df73f83e4	39cd1d73-920e-4a57-a604-d4779c4dac8c	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	2	78000	\N
781f3bbf-3c04-4101-bba8-332cce243bb8	39cd1d73-920e-4a57-a604-d4779c4dac8c	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	3	117000	\N
ce74958b-1f5b-4f56-b939-8b46b717aebb	39cd1d73-920e-4a57-a604-d4779c4dac8c	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	1	48000	\N
6fe9b62c-30a5-4e25-930a-d443a805e741	fbbaf8c7-cdd0-42cd-bdaa-64b51352b654	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	3	132000	\N
4d04ee97-f62e-41b5-aca7-78738a89538c	fbbaf8c7-cdd0-42cd-bdaa-64b51352b654	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	1	48000	\N
c8285dcb-f495-405c-be58-eae840aa5b00	fbbaf8c7-cdd0-42cd-bdaa-64b51352b654	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	2	78000	\N
bb5d550f-45e9-4c2e-a99b-e82fccd09f64	fbbaf8c7-cdd0-42cd-bdaa-64b51352b654	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	3	144000	\N
52b4ff00-4228-4bdf-b7f8-fc9d46a7d859	19af9944-d66c-4d55-8eec-7401c0f962d5	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	1	34000	\N
26f9fd4b-6368-4399-be3b-787e6f677916	0c5f4a38-106e-4540-975a-ac0afc339968	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	2	108000	\N
177c2086-2c95-4b09-9682-5820bbc1bdca	0c5f4a38-106e-4540-975a-ac0afc339968	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	3	117000	\N
0d048334-a046-4e1a-b211-8dc4d4da197f	4312b4ac-0bdf-4163-bfce-4f6934b8bf5a	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	3	117000	\N
cd8aaf5c-f3fe-4e96-9ff3-d36a5bac0bba	4312b4ac-0bdf-4163-bfce-4f6934b8bf5a	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	1	58000	\N
3cd35c55-8b4b-400b-8975-2fe53390fbcd	4312b4ac-0bdf-4163-bfce-4f6934b8bf5a	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	2	96000	\N
271bf21f-11e5-4ca8-bcb3-d4de2bc455aa	c8c7e583-1732-41e4-b114-e51782e84a83	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	1	48000	\N
a2b92928-b92e-468f-a0d5-975ce6ded701	c8c7e583-1732-41e4-b114-e51782e84a83	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	2	78000	\N
18f03116-104b-40cf-8f17-7d5753f6baea	c8c7e583-1732-41e4-b114-e51782e84a83	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	3	117000	\N
ab08b139-3342-4d3b-92ca-19395fa06b0c	c8c7e583-1732-41e4-b114-e51782e84a83	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	1	19000	\N
c6be3fef-06e5-42d4-b26d-d241d1bbc9b3	9117a9b5-15b0-43eb-837f-871f419f7899	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	2	138000	\N
692205ad-96b6-4883-b7f5-f626b45197be	7117aa81-a396-497f-8b4a-1544ae5bcd53	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	3	162000	\N
b188e7ef-29f8-448f-bf09-76bfb6b29f85	7117aa81-a396-497f-8b4a-1544ae5bcd53	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	1	39000	\N
27cfd5da-66fc-45b4-8583-ea6024da2904	6517e24a-c096-4561-8e36-b87e9a3dfc25	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	1	39000	it da
fd020042-d23e-4b0f-ba50-36916946f152	6517e24a-c096-4561-8e36-b87e9a3dfc25	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	2	38000	\N
1b17be4b-5852-49a5-9f87-e115f18f9fc5	6517e24a-c096-4561-8e36-b87e9a3dfc25	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	3	132000	\N
44a1fe12-ca6d-40c1-8ccc-27c9fd5aff20	58b750eb-c87a-4ab9-89aa-6e56f2a3599b	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	2	38000	\N
aa9bdac9-93c1-4678-803b-b7465e9906d1	58b750eb-c87a-4ab9-89aa-6e56f2a3599b	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	3	117000	\N
b344ec2e-4cc5-448c-b11e-e4e584f4f79e	58b750eb-c87a-4ab9-89aa-6e56f2a3599b	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	1	34000	\N
c79dc23f-dd6d-4074-bd40-f9c8fea97d44	58b750eb-c87a-4ab9-89aa-6e56f2a3599b	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	2	96000	\N
760bae03-b568-4de1-8f5e-4ad9a529b831	dffe016c-19b2-4ca5-82f5-2ed2a41868c3	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	3	117000	\N
21ede8cd-f335-4b53-8605-ca5f138a7607	25fc0c4d-acef-497a-8024-8f9a77e7792d	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	1	34000	\N
45b8112e-4971-4e0e-8d26-8125d11ea56a	25fc0c4d-acef-497a-8024-8f9a77e7792d	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	2	96000	\N
7dfc0b74-4657-40f0-a5a9-94ad1fd258ef	56f968f9-2956-4bf3-bb72-35d8480e59b9	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	2	96000	\N
44f36af2-0c96-41dc-9069-74c6521af570	56f968f9-2956-4bf3-bb72-35d8480e59b9	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	3	102000	\N
67d3e4a5-f37f-4368-989e-27415ee60cc0	56f968f9-2956-4bf3-bb72-35d8480e59b9	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	1	48000	\N
83ec073a-b7e5-4ff2-b362-546a61a0fab9	8d8bbf6d-6df2-4259-8179-043aadca636d	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	3	117000	\N
05df943e-1d9d-4a06-8831-1c3a29a4cf81	8d8bbf6d-6df2-4259-8179-043aadca636d	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	1	48000	\N
9da28990-f331-461e-be11-d2e98569f179	8d8bbf6d-6df2-4259-8179-043aadca636d	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	2	138000	\N
52f5eda3-6c09-4d57-8e44-d7a15f653f9f	8d8bbf6d-6df2-4259-8179-043aadca636d	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	3	144000	\N
e242ea9e-8ea7-45de-8689-0a3577f4f3b3	5418e600-da7d-4227-a433-6d006c8edac1	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	1	39000	\N
b387fdd5-008f-40cc-a057-7b17115bfd29	95b939d9-e39e-40c7-8d4d-9685d093555f	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	2	96000	\N
32c7c75f-8faf-4868-9234-de9c3bd14541	95b939d9-e39e-40c7-8d4d-9685d093555f	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	3	117000	\N
87c604dc-c33b-4d3b-b457-ab9dff26ec7c	29d38982-e17f-4221-a657-1c7e0d15e747	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	3	117000	\N
0d3136ba-9365-4919-92ad-617b37e853c7	29d38982-e17f-4221-a657-1c7e0d15e747	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	1	39000	\N
4d493129-35a8-43b6-9877-b758be9bfa06	29d38982-e17f-4221-a657-1c7e0d15e747	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	2	38000	\N
c3741baf-41ae-4fb9-80e2-01f0d96c2102	e21c3277-6044-45cd-9a90-2c6903d8393d	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	1	48000	it da
48916ffa-f8d9-4cfe-9e67-81228c2ae6a1	e21c3277-6044-45cd-9a90-2c6903d8393d	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	2	16000	\N
6553246d-5e3d-4e8d-9814-27ab7c97f495	e21c3277-6044-45cd-9a90-2c6903d8393d	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	3	117000	\N
4ee14b57-4cec-4cbd-ae1c-0ec7cff8f5f4	e21c3277-6044-45cd-9a90-2c6903d8393d	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	1	34000	\N
4d989f02-6f2f-4c9e-b18e-4010e5d4e4b4	73ac4bcb-1cb2-4db6-bfc5-c32ca9d04792	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	2	78000	\N
6fd17b3a-7051-4ae8-ba69-53fc05194ce5	1b3aa80f-c1c0-43e1-9fb8-c0f192861b43	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	3	57000	\N
8adfdff0-387f-4cc7-936c-fcb82832a710	1b3aa80f-c1c0-43e1-9fb8-c0f192861b43	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	1	39000	\N
75479c52-c2e3-45eb-b78a-f6144623117b	11250c11-547c-4b4f-8474-e7673c682988	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	1	29000	\N
30d7f2b0-8c68-4d2a-9736-8e19513657de	11250c11-547c-4b4f-8474-e7673c682988	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	2	68000	\N
28f9fdb1-f2d7-4b14-9950-52b547dbcdd9	11250c11-547c-4b4f-8474-e7673c682988	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	3	117000	\N
335c01cd-0eac-4f45-a66a-e60e4d6de715	9914a6e5-ba1c-4483-8efc-a7b3589c744e	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	2	78000	\N
9c820222-12c7-4309-9c17-3f99cee54455	9914a6e5-ba1c-4483-8efc-a7b3589c744e	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	3	144000	\N
1256bd77-4f5b-43d6-8b86-122f144064a1	9914a6e5-ba1c-4483-8efc-a7b3589c744e	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	1	39000	\N
dac6ef12-cf34-4970-be3e-705b5cb205d4	9914a6e5-ba1c-4483-8efc-a7b3589c744e	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	2	96000	\N
56a363a4-e983-4033-9dae-2931671df0bd	4ff5edff-7209-437f-951d-7fe9a6a0bca4	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	3	144000	\N
e94b25bf-49f0-4873-955f-b2b395c1cbe5	f696a2a1-50de-448e-80ad-35dfceefa497	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	1	48000	\N
dab77572-3919-4297-8be3-2c943d1ec333	f696a2a1-50de-448e-80ad-35dfceefa497	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	2	90000	\N
180578e2-80d2-4008-8b1a-779894a17284	6ff4b6c1-3ecd-4ffb-a09b-8bd51590d5a7	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	2	78000	\N
8cc3020e-880d-45cb-ad54-98898248ca69	6ff4b6c1-3ecd-4ffb-a09b-8bd51590d5a7	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	3	165000	\N
157ab116-11f3-4d66-a01a-13082195b4f8	6ff4b6c1-3ecd-4ffb-a09b-8bd51590d5a7	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	1	48000	\N
91cf5e8e-50bf-47e4-a08a-ca6b4c6289a2	cb1e0c46-8e56-4d3b-ac6a-e562e9647533	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	3	174000	\N
2bbdc42e-52f5-472b-9baf-e44be46e588b	cb1e0c46-8e56-4d3b-ac6a-e562e9647533	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	1	48000	\N
12f1adb5-1868-498f-b862-fd001e3b7b9e	cb1e0c46-8e56-4d3b-ac6a-e562e9647533	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	2	78000	\N
f324a3a8-d1db-4d0a-8e56-3f6ee6c15470	cb1e0c46-8e56-4d3b-ac6a-e562e9647533	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	3	117000	\N
6fbdbb2f-93fe-46d9-be0a-7dfc65ce90a9	08ca1dd3-e6e2-42f4-9d15-d931a77a97bd	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	1	39000	it da
2ed023af-2a24-4cc2-891e-bae16ff47ac1	dc057591-22ed-4cc2-bac2-062dd25aace9	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	2	96000	\N
0004e7de-f35e-4765-9abd-bd7ce08a9554	dc057591-22ed-4cc2-bac2-062dd25aace9	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	3	45000	\N
db484f91-f20f-4b00-a7d0-de087d848f1d	28f3881a-aca8-4c72-b33c-ea5dee9d7394	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	3	117000	\N
9ff14738-9761-49ce-a4a0-8bc4f06c3268	28f3881a-aca8-4c72-b33c-ea5dee9d7394	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	1	39000	\N
e13d4f95-9c48-476d-98cd-34b864ddfca5	28f3881a-aca8-4c72-b33c-ea5dee9d7394	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	2	78000	\N
e37c0a93-7588-487c-b546-4084a60157e7	c04de75e-dc23-4072-9e8d-6ed6349282b8	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	1	19000	\N
3f89177f-036f-4b8b-b1bd-d5a746b1d711	c04de75e-dc23-4072-9e8d-6ed6349282b8	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	2	88000	\N
acc5aa10-455b-419e-9450-fb0890a1a3ee	c04de75e-dc23-4072-9e8d-6ed6349282b8	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	3	144000	\N
d0ae7211-8d05-4068-b6f3-cbcdf29b7f33	c04de75e-dc23-4072-9e8d-6ed6349282b8	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	1	39000	\N
a9099f8b-4861-422d-8c4c-95ca640ab6ac	673748a6-68ee-4be4-9fa6-539f9d1d8b22	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	2	78000	\N
5c0354cb-005d-4070-a5c4-9723c0d99dba	03e2737b-64ca-4719-860c-af87e69e8227	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	3	102000	\N
758b8400-7f1d-49b3-8f8f-b96e17f609fa	03e2737b-64ca-4719-860c-af87e69e8227	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	1	54000	\N
708abbf5-cfe4-435e-9f22-ef4bb8d02ec7	d9c8bf33-fb64-4b72-ae87-fd4680fd588c	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	1	48000	\N
6b3f6be5-4087-47a5-bb57-c77a2839a1f4	d9c8bf33-fb64-4b72-ae87-fd4680fd588c	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	2	78000	\N
9c391dfd-fde5-47b8-a986-d06f9c811f06	d9c8bf33-fb64-4b72-ae87-fd4680fd588c	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	3	174000	\N
9a314292-b3c4-4234-9434-01b1b265d9ca	dd854fc7-889f-4d5e-81d5-1df8669d9fe0	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	2	68000	\N
c5149869-e8e5-42e6-90af-36aebfb85d2d	dd854fc7-889f-4d5e-81d5-1df8669d9fe0	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	3	144000	\N
c6919df6-3c48-4a8b-aadd-e75847b68f8e	dd854fc7-889f-4d5e-81d5-1df8669d9fe0	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	1	39000	\N
9a2a3182-ab04-496a-9b87-0826adb94e7b	dd854fc7-889f-4d5e-81d5-1df8669d9fe0	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	2	78000	\N
fdcc5aa0-d1ed-4b8c-86c8-c2d92235ed9b	c2b38996-ee17-41d0-90b8-6034eb74077f	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	3	144000	\N
11256911-4683-4971-bad9-ee420d882802	ada5a2c8-6114-4820-adb6-4b1aba43f249	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	1	48000	it da
ea232abb-c861-4751-884d-2f6cd8f2460c	ada5a2c8-6114-4820-adb6-4b1aba43f249	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	2	108000	\N
f90a3858-9700-4155-b859-d105d8e6146a	47aff4c1-fb63-41e4-a1ef-80f205a527ee	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	2	78000	\N
123719f5-091e-4224-8b81-b8995e44c372	47aff4c1-fb63-41e4-a1ef-80f205a527ee	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	3	117000	\N
bd29a1ae-e9b6-4365-af8c-15e53e0040b6	47aff4c1-fb63-41e4-a1ef-80f205a527ee	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	1	19000	\N
c20004d9-cecb-4c31-a2a1-db000be0012c	cd846df3-b773-4bcc-8927-93c63167aece	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	3	117000	\N
424516b0-3d65-4746-a217-b5e7c1864d45	cd846df3-b773-4bcc-8927-93c63167aece	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	1	19000	\N
092d3d64-1591-468d-8a94-fee5bc91c1aa	cd846df3-b773-4bcc-8927-93c63167aece	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	2	78000	\N
8504abf7-fe80-4016-b6cb-8fe186ae6032	cd846df3-b773-4bcc-8927-93c63167aece	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	3	102000	\N
faf0ada4-5fc5-47a3-9d4a-f09aeba07d6e	ba969e3c-c672-4242-b09e-be50da32c305	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	1	8000	\N
eec25bbb-a1b7-4a6b-94c3-2c9ca6619e05	6d0e3064-cb14-4816-97c8-93b42f65cf04	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
3b50241f-d92d-4824-bc67-8e8fef21391c	6d0e3064-cb14-4816-97c8-93b42f65cf04	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	3	102000	\N
94d35b0b-c60c-4618-8f3f-08a2dece1daa	4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	3	117000	\N
3ca2c59a-9b77-481f-a834-fbcad4d64e1b	4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	1	48000	\N
d09f2658-e9b8-4b39-95df-e83c9e61e58d	4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	2	68000	\N
30f1fb69-943b-4951-a1bb-f447302a5574	3d07fedf-6101-4538-b6b2-4bb5b42055bb	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	1	34000	\N
b179360e-3fb3-44d4-99d5-bfe252ab58db	3d07fedf-6101-4538-b6b2-4bb5b42055bb	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	2	78000	\N
feb01c49-d34e-42c8-a52e-87807c7def75	3d07fedf-6101-4538-b6b2-4bb5b42055bb	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	3	144000	\N
8547e64a-9d75-49c0-9024-5769d8b3ca1a	3d07fedf-6101-4538-b6b2-4bb5b42055bb	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	1	69000	\N
e336f252-f7f6-4632-a916-c3e5b06e4fc7	39b49542-ebea-4039-b6de-dc96e1748c59	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	2	96000	\N
3f7b0db6-be9c-43a2-af7b-9c3d07391c4c	fe737737-fae0-4721-8af0-650ea3324534	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	3	117000	\N
b8b9a4e2-7608-43ba-ae9d-bcc6bc05ab25	fe737737-fae0-4721-8af0-650ea3324534	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	1	48000	\N
a8b2263f-b46a-47a7-ac82-02f5b9c0fb24	d330a3a8-a500-4393-8987-1d31fc6fb468	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	1	45000	it da
a4f6c3ee-725f-455f-bef4-ac54c34cecf1	d330a3a8-a500-4393-8987-1d31fc6fb468	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	2	78000	\N
35cb4b01-880f-44b1-9d01-c7742d7a5d90	d330a3a8-a500-4393-8987-1d31fc6fb468	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	3	117000	\N
a689c9e7-24cf-44ef-a36e-86e77b2082a5	c646ab28-b848-476c-beff-f9249d6ed425	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	2	110000	\N
1f89bb8e-cf01-409d-8c28-90043ebcb636	c646ab28-b848-476c-beff-f9249d6ed425	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	3	144000	\N
b5fd2f12-ea19-474f-9747-9e7b8a2f268e	c646ab28-b848-476c-beff-f9249d6ed425	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	1	8000	\N
569f16da-720f-40d3-a677-5e6d92a54d7d	c646ab28-b848-476c-beff-f9249d6ed425	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	2	78000	\N
070ded3c-5c73-42da-9198-f412aee6fc6d	c0b0a6a6-8c87-4a99-8e50-db78355b1f05	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	3	144000	\N
2ff7919b-d7cc-43e5-b64e-a30b7664d026	13725580-c2fa-4e7f-acad-50ed90d2e9fa	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	1	39000	\N
8961ee8c-c96c-45c2-af19-0ff7d9d300c3	13725580-c2fa-4e7f-acad-50ed90d2e9fa	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	2	38000	\N
eaa857c7-83ca-4d16-a2d2-e51644c742f2	21c38fbf-3f11-4d57-9c08-1acb102759cf	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	2	30000	\N
e917e68d-f80e-4970-adeb-8afffc496bc0	21c38fbf-3f11-4d57-9c08-1acb102759cf	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	3	87000	\N
bbe6d4f1-573b-4f19-8356-bc13df591674	21c38fbf-3f11-4d57-9c08-1acb102759cf	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	1	34000	\N
c643b840-2ddd-4ef5-8495-2512520ef598	e975fec2-a659-4548-a864-c16eaa790af0	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	3	117000	\N
1726fc7e-2f6d-4939-afab-87279d283e74	e975fec2-a659-4548-a864-c16eaa790af0	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	1	39000	\N
f6382615-80b0-4936-8942-46b0f7cb336e	e975fec2-a659-4548-a864-c16eaa790af0	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	2	96000	\N
8273491b-c37c-4a1c-bb80-235aa813144d	e975fec2-a659-4548-a864-c16eaa790af0	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	3	117000	\N
afc146e0-7e6e-41f3-b932-5bb1d9f3349f	fd0c536d-22f9-4fbb-8a25-d7e2611b02fe	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	1	44000	\N
e38b6f8b-aec1-47f0-89ca-82faf425b5e2	042c2a4f-e6f9-4e68-8f8e-29e932a02dd0	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	2	68000	\N
b2847a12-3ab6-4b14-80de-a3bba14ef58b	042c2a4f-e6f9-4e68-8f8e-29e932a02dd0	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	3	144000	\N
0981843f-f375-4512-8111-db14c9275deb	1c3c9fd3-a4ae-4809-b856-9eae0613551c	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	3	162000	\N
355a7dd3-6f35-49a1-85df-27265d46eff0	1c3c9fd3-a4ae-4809-b856-9eae0613551c	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	1	39000	\N
e7cff2f2-01b5-4820-986a-0bad1b504b6b	1c3c9fd3-a4ae-4809-b856-9eae0613551c	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	2	110000	\N
d87152ba-9793-4d32-ad4f-1aeb5fdbc2ca	e23d1f59-dd2a-452f-9e07-28f7c9b90667	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	1	39000	it da
8dd70393-97f9-482c-ab7d-3629e4993010	e23d1f59-dd2a-452f-9e07-28f7c9b90667	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	2	116000	\N
50c53205-747d-491c-9854-25be55321ca7	e23d1f59-dd2a-452f-9e07-28f7c9b90667	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	3	144000	\N
4d94f7de-cb2c-43c4-b5b1-cc3252d7d380	e23d1f59-dd2a-452f-9e07-28f7c9b90667	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	1	39000	\N
7ab60427-b4dc-4d80-b580-d88a42f3e99a	0baaccc1-a3d0-470e-bc47-b9680908d840	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	2	96000	\N
84564c44-5167-4679-89b5-3429ade881f6	448853fe-46cd-437b-a4ec-09fce67630b2	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	3	207000	\N
06cbf50a-8353-46cf-8e95-ce5aac50ebab	448853fe-46cd-437b-a4ec-09fce67630b2	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	1	48000	\N
84d08fb6-f575-44ca-bc01-4c56e1c4da4d	ddeaa13b-143a-410f-8efc-6aac49d5e35b	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	1	54000	\N
59be88c8-02e0-453b-a588-5adade7ec236	ddeaa13b-143a-410f-8efc-6aac49d5e35b	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	2	78000	\N
d206a189-3ab4-432c-b546-6432c3f40baf	ddeaa13b-143a-410f-8efc-6aac49d5e35b	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	3	117000	\N
c20d321f-bb1e-42ef-9418-78800b90bb2d	7617ed61-38f5-443c-bdf7-fe638c906210	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	2	78000	\N
9ab0e212-021a-473e-8eaf-383fd69049d1	7617ed61-38f5-443c-bdf7-fe638c906210	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	3	57000	\N
c39106be-8da9-43eb-90a5-6bec98e6572b	7617ed61-38f5-443c-bdf7-fe638c906210	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	1	44000	\N
2bcb1652-e39c-4ae8-acf3-10b9f4094c83	7617ed61-38f5-443c-bdf7-fe638c906210	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	2	96000	\N
3abfe60d-c8e6-47eb-8c80-275f8710dc45	aa545fcc-840d-48fc-980e-1ceb4fa0d822	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	3	57000	\N
ed197522-0dab-4c8a-8897-41c83fe5b297	c2d29eec-64eb-49fa-915f-0c7dc8e97d7e	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	1	39000	\N
7d155350-c506-45ee-8e8e-8baa7a7f6cc7	c2d29eec-64eb-49fa-915f-0c7dc8e97d7e	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	2	68000	\N
0fe4603f-686e-40e2-9c15-6ffda5e7a460	e6d314b1-d4e8-480f-a14b-34c75eb0f1e0	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	2	68000	\N
dc9e1701-4a88-4dcf-90f1-402f24a9e768	e6d314b1-d4e8-480f-a14b-34c75eb0f1e0	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	3	144000	\N
a5d3e843-6c8b-4789-bea5-0506b7f580b6	e6d314b1-d4e8-480f-a14b-34c75eb0f1e0	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	1	39000	\N
26ad84e2-e24c-4d51-93b1-3e0c98daa64d	07814485-ca67-478c-976f-6487c5cecdf4	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	3	144000	\N
8f806cbc-a1d9-49ee-955d-c11a4c96b50a	07814485-ca67-478c-976f-6487c5cecdf4	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	1	34000	\N
cf1b1854-2095-4d92-911b-08945ec8e970	07814485-ca67-478c-976f-6487c5cecdf4	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	2	96000	\N
dd03f8bc-8a4f-4e37-9ffc-14b7640486b9	07814485-ca67-478c-976f-6487c5cecdf4	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	3	117000	\N
0403283d-5185-4277-9046-2aa826d61232	f3ea119a-2f1a-4129-bce5-b618108e60eb	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	1	39000	it da
2b5ae62f-01cb-4d1c-8a87-4bd00d9ef067	36e00d34-8be0-401c-b154-eeb228d478e7	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	2	78000	\N
aa4c9b35-30a6-4ebe-b0a5-5974b12437f9	36e00d34-8be0-401c-b154-eeb228d478e7	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	3	144000	\N
ee9299d1-1e98-4cd7-8653-773decd7abdc	02533b08-c249-4395-99fa-9626d71d0fa1	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	3	144000	\N
6686cf68-2e9f-420d-a23c-6d29b80769ed	02533b08-c249-4395-99fa-9626d71d0fa1	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	1	39000	\N
96c2bd60-8f8a-4575-a81f-84a18f765d15	02533b08-c249-4395-99fa-9626d71d0fa1	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	2	78000	\N
a5d372b5-f0d2-400f-9670-d8398f58099c	a8cfcf5a-6d38-4c26-9551-625326ab3e9f	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	1	39000	\N
e8f31c88-0b5f-4244-bb45-1acaf7a925ff	a8cfcf5a-6d38-4c26-9551-625326ab3e9f	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	2	78000	\N
6dbe9132-0992-4cce-b5db-5f584ddd82e1	a8cfcf5a-6d38-4c26-9551-625326ab3e9f	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	3	57000	\N
ca6517e9-edd1-49a3-affc-ad21806ec43c	a8cfcf5a-6d38-4c26-9551-625326ab3e9f	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	1	39000	\N
7d2877fc-b9ab-49a0-9fea-9f32adeb06e3	d2ab4cf0-da12-47d6-b441-89ae7e050d12	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	2	96000	\N
38f0ab17-44a8-4119-8788-64fa2f211f5a	22814d37-f455-4473-95b8-b33f5e4c17a6	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	3	117000	\N
08d8b873-4823-4713-be46-72b4576af9a2	22814d37-f455-4473-95b8-b33f5e4c17a6	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
d33b434a-9d3a-4c75-b6ee-0d7a059a0b81	399eb380-bc41-4d99-aad7-4772b67f2828	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	1	19000	\N
290e2fc6-f676-4eb4-846a-23c7a8da7036	399eb380-bc41-4d99-aad7-4772b67f2828	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	2	78000	\N
2c5afc89-82be-4312-9d9c-e21f2653d1a0	399eb380-bc41-4d99-aad7-4772b67f2828	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	3	144000	\N
970f15ff-c70c-4bde-9db3-840f722e710a	3577f2f5-23ca-44a1-b106-7d1f8d329877	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	2	58000	\N
24097b3c-46be-4bd5-a589-a120a6e23cd0	3577f2f5-23ca-44a1-b106-7d1f8d329877	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	3	102000	\N
a01355d5-e10e-4cd1-accb-88fc7a350741	3577f2f5-23ca-44a1-b106-7d1f8d329877	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	1	39000	\N
e5ec351a-eb93-4893-9e40-6871db1fa095	3577f2f5-23ca-44a1-b106-7d1f8d329877	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	2	96000	\N
6185cb70-8d6e-4910-8c52-c2d4773a3bb6	6d45cb84-dfc2-4a9e-9c03-d3b86c6330d9	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	3	117000	\N
51add61f-d0c2-4025-9a6e-ee1503b9bf35	b6449b9d-e90b-46b9-ab6c-b88d32978315	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	1	48000	it da
d548e489-98a9-4edb-856f-71b1849d7377	b6449b9d-e90b-46b9-ab6c-b88d32978315	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	2	78000	\N
b0b7dd11-db86-4d1e-bcc4-8147f67b3e26	917519c6-f772-412c-94b1-11b3657b03a5	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	2	96000	\N
d7723bcc-f013-4f78-9750-8f1a5be38297	917519c6-f772-412c-94b1-11b3657b03a5	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	3	135000	\N
4faa9a8e-db47-49e4-aee4-5c246daa2df3	917519c6-f772-412c-94b1-11b3657b03a5	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	1	39000	\N
99ffa47b-7e00-4dd8-859e-fbe975667876	e3800ad9-59af-4a01-bbad-e9cd16a66c3b	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	3	117000	\N
80a1a7b2-82ed-42fe-b649-cf17c3374248	e3800ad9-59af-4a01-bbad-e9cd16a66c3b	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	1	55000	\N
d2b1b5d5-ec1d-4691-afc0-b068c66917e5	e3800ad9-59af-4a01-bbad-e9cd16a66c3b	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	2	96000	\N
839f002c-458f-47a4-8302-77455bb4d4b1	e3800ad9-59af-4a01-bbad-e9cd16a66c3b	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	3	24000	\N
1cedae8c-fa30-4112-8974-03f9f4d0fccc	aa244841-cd05-4bbf-8ab2-4aa783e73535	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	1	58000	\N
35cc2506-a0f8-4617-9518-673e4fc3d53e	27725e9c-1ab5-442a-8d01-8dfa981839ed	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	2	78000	\N
00154acb-f1af-47a4-b9a5-d5ad008aa1b4	27725e9c-1ab5-442a-8d01-8dfa981839ed	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	3	117000	\N
4685af2b-6dcd-42f4-90b0-48a0b584a5a2	c7ebecd4-5a36-4dcb-8606-bc53e4060549	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	3	144000	\N
e57098fd-e280-4299-9368-303ae18004cc	c7ebecd4-5a36-4dcb-8606-bc53e4060549	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	1	15000	\N
d788f789-82a3-4ed7-9e3b-afdf9a1e9c4d	c7ebecd4-5a36-4dcb-8606-bc53e4060549	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	2	58000	\N
84c84cbc-8044-438f-ba56-e8879825cf8a	ceec3fd0-f090-47f8-8193-c5327c7b1c7b	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	1	39000	\N
71fd6a1c-ed77-4a87-86a9-f2c788d8686d	ceec3fd0-f090-47f8-8193-c5327c7b1c7b	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	2	78000	\N
81496feb-b8e3-48e9-b969-64852e160be3	ceec3fd0-f090-47f8-8193-c5327c7b1c7b	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	3	117000	\N
b69b901f-ea7a-43c5-9c26-29ab931ead67	ceec3fd0-f090-47f8-8193-c5327c7b1c7b	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	1	48000	\N
c30f8399-9641-4091-8439-6c79fb6b90f1	bd314256-cbb9-4e7c-bea7-4019dab22c2e	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	2	38000	\N
db35a7e1-0d3f-4e13-86d5-b5801de7658a	3ebe5151-c98c-4166-9d44-8b438e742256	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	3	117000	\N
2de759d7-a6c3-4cf0-b5a4-97564519a269	3ebe5151-c98c-4166-9d44-8b438e742256	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	1	34000	\N
168272a3-8cf9-457e-9a51-7a1fd81b28a6	43531c45-f37a-4224-8b96-8b560999c07c	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	1	34000	it da
401bfbdb-6082-4a27-98a6-3107ba1dc909	43531c45-f37a-4224-8b96-8b560999c07c	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	2	108000	\N
cad44220-6269-4ee5-a825-2ac9102fd4b1	43531c45-f37a-4224-8b96-8b560999c07c	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	3	117000	\N
134e52fb-2d7e-4051-8340-152b0d5b5c4d	a72a71ea-98eb-4136-9adc-1fb82cffc395	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	2	96000	\N
9a20c243-3c8a-417c-af4a-5d29e65f83db	a72a71ea-98eb-4136-9adc-1fb82cffc395	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	3	117000	\N
b103d641-3cae-4944-a870-3cef915e47fd	a72a71ea-98eb-4136-9adc-1fb82cffc395	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	1	58000	\N
85f35397-babd-4ac7-ae36-9c36caa83df0	a72a71ea-98eb-4136-9adc-1fb82cffc395	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	2	96000	\N
71fd787a-0bb3-4ac4-b7e6-9ebaf9614177	fafd21a5-ea19-4fda-b002-0accbb3af002	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	3	102000	\N
0d228e01-af13-4bbe-8069-7c57132c02ae	c767256e-f8a0-4bf2-89cc-1d34afe781d4	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	1	48000	\N
62c26abd-f111-4157-97ab-f9b53d17cf5f	c767256e-f8a0-4bf2-89cc-1d34afe781d4	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	2	138000	\N
e29e0427-b8bd-4e63-ac17-039ff15eff40	3fc345bf-8ba7-4af4-8e5a-0cde42bd085d	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	2	96000	\N
decd986e-3cf3-469f-b7a0-137ca2c095c1	3fc345bf-8ba7-4af4-8e5a-0cde42bd085d	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	3	162000	\N
e264b8e5-aa48-40f6-b2df-c7da43fb053f	3fc345bf-8ba7-4af4-8e5a-0cde42bd085d	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	1	39000	\N
72aceb37-0297-4fb4-9bdd-2ea4b8ce22ef	a1b165ff-86f1-4163-9b68-0029dadfd2b3	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	3	117000	\N
f6c1f3ee-dd2a-423e-ab98-6b390b9a106d	a1b165ff-86f1-4163-9b68-0029dadfd2b3	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	1	39000	\N
6c37c41e-20d4-45da-a0b4-8932ee26df2c	a1b165ff-86f1-4163-9b68-0029dadfd2b3	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	2	38000	\N
e9285ead-657f-46e9-b6f2-9bef73c3ba55	a1b165ff-86f1-4163-9b68-0029dadfd2b3	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	3	132000	\N
36dd2f7b-fb78-4229-adfd-66c215ee0f5e	f9275d40-0b73-41e5-bea5-04e6f3068124	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	1	39000	\N
3a0ab637-fc6b-4fd2-b767-51450b4155b3	5d13a0fe-b05a-4eb8-a3b6-48ae16eb70f7	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	2	16000	\N
443e7efb-800e-4f4e-a89d-cc469f6bf977	5d13a0fe-b05a-4eb8-a3b6-48ae16eb70f7	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	3	117000	\N
9ce13d1d-339c-414c-a7b7-61a0ae5dd2be	484fbd0d-e1de-43a8-9000-7649eda63866	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	3	117000	\N
dd58ff55-7ddc-42da-9d11-3002dad7d572	484fbd0d-e1de-43a8-9000-7649eda63866	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	1	34000	\N
0204e46f-c18d-4113-af72-815bd6dcff45	484fbd0d-e1de-43a8-9000-7649eda63866	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	2	96000	\N
f6a28974-21d6-4ab5-ae08-6ef772a62d2b	76061146-c183-4a34-92aa-f5191d313c2b	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	1	39000	it da
d86915ea-c1b6-4903-93da-d32ae493c2a1	76061146-c183-4a34-92aa-f5191d313c2b	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	2	96000	\N
2accb6be-15d7-44f3-b8ef-78c71092ef43	76061146-c183-4a34-92aa-f5191d313c2b	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	3	102000	\N
a8aa14ee-9170-4d39-86a7-05b7b716f575	76061146-c183-4a34-92aa-f5191d313c2b	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	1	48000	\N
cefc66bc-e6f3-437f-8b46-6ccac37151b3	8f0a75d9-f509-4552-86d9-349e82591219	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	2	68000	\N
b0cf8c35-ea3d-4293-8aa2-dbc8481ee810	92a9d5ef-7aec-4348-8bd0-cc81058b0844	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	3	144000	\N
6c766d7b-d0aa-4f4c-85a0-b47b9b7c8553	92a9d5ef-7aec-4348-8bd0-cc81058b0844	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	1	39000	\N
dfcd2637-18da-4dbc-a1a8-d7aee3b92c5b	169423f1-7580-4b9a-82cc-9ebf8d6a7591	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	1	39000	\N
157c1260-a756-46af-a6e2-b0c595167beb	169423f1-7580-4b9a-82cc-9ebf8d6a7591	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	2	96000	\N
88a0fea6-4f91-4d50-b81f-3e8c90a1e9c5	169423f1-7580-4b9a-82cc-9ebf8d6a7591	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	3	117000	\N
ce4563cf-b569-4022-beb1-e750dfa04f7c	10c82dec-1338-45cf-9b7f-eab5f3083027	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	2	90000	\N
97cb9205-385b-4d80-839c-36a244585642	10c82dec-1338-45cf-9b7f-eab5f3083027	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	3	117000	\N
5c74f6ca-efa5-4e33-a0ca-87ea304bd229	10c82dec-1338-45cf-9b7f-eab5f3083027	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	1	39000	\N
887e9530-e9a7-4dea-a407-b2591f526ad3	10c82dec-1338-45cf-9b7f-eab5f3083027	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	2	38000	\N
f40ef7fd-092b-4d8f-bf97-be2cda3a0b39	73a99bd6-683d-4705-b95d-50689f446357	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	3	165000	\N
3a1db1a1-534d-4f04-8c6e-e7273b3c1c91	f296fb32-736e-4969-95c8-d164d65f7234	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	1	48000	\N
0ac21942-699a-4f75-85bf-d45ff33516b8	f296fb32-736e-4969-95c8-d164d65f7234	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	2	78000	\N
df40f4e9-2495-472a-86f0-b640b39ea3c9	6531f4d0-de11-40aa-8092-490878da2096	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	2	78000	\N
99b8acca-e249-479d-aa9f-cac81ab561ea	6531f4d0-de11-40aa-8092-490878da2096	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	3	57000	\N
094ac1d1-9081-4660-801c-59985791243c	6531f4d0-de11-40aa-8092-490878da2096	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	1	39000	\N
3738a07a-d223-41d4-9931-585b01705c41	21b57388-ce20-4829-8cea-5bee24351243	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	3	45000	\N
5210d372-4407-4733-827f-c8f14be363e8	21b57388-ce20-4829-8cea-5bee24351243	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	1	29000	\N
2366bbaa-5b0f-4865-9fbf-74f62224e579	21b57388-ce20-4829-8cea-5bee24351243	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	2	68000	\N
761bf243-d4b5-4c86-90db-b01bd606eb71	21b57388-ce20-4829-8cea-5bee24351243	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	3	117000	\N
3d1e0bef-20c0-4f19-9a0e-cf608f2393df	949f557f-d357-4a9e-81fb-13ce77a332ba	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	1	39000	it da
e9201b42-a13b-46f7-b1e8-a0aafd331902	286a4356-4acd-4e60-8901-452dd6420d32	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	2	88000	\N
32966c0d-5eb4-4335-92f6-7182dd4d7912	286a4356-4acd-4e60-8901-452dd6420d32	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	3	144000	\N
08995336-c5e0-4b75-b02b-9577a632da52	ec804db0-68bd-4a51-8139-a637605c04cb	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	3	102000	\N
45015f6f-b9b3-4eb3-80bb-54d6fee6cc07	ec804db0-68bd-4a51-8139-a637605c04cb	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	1	48000	\N
17ce78f9-e696-4db6-bc27-38efe4c0f705	ec804db0-68bd-4a51-8139-a637605c04cb	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	2	90000	\N
cb50766d-1bb2-42a4-a653-124c75b147d4	041ba300-8eaf-4030-8b12-1c2d8f54968b	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	1	54000	\N
1df06c39-ed15-4ee8-bca1-2eb7c1db5b13	041ba300-8eaf-4030-8b12-1c2d8f54968b	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	2	78000	\N
b187352b-c54c-4609-8622-819f0ed4ae35	041ba300-8eaf-4030-8b12-1c2d8f54968b	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	3	165000	\N
48ace333-4e93-490b-a5d5-a2034fccba1c	041ba300-8eaf-4030-8b12-1c2d8f54968b	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	1	48000	\N
70ee9317-b09e-4d55-bab8-df97900f5fff	2f95ce1b-4d49-4590-bd4b-214f9c529844	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	2	78000	\N
37140438-acad-4cca-a9a0-4c03187bc89f	7a95fb1e-fd32-42af-9137-7438d7cd54df	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	3	144000	\N
f697e1e6-3ad2-4f1c-99c1-ee7a0784c1e3	7a95fb1e-fd32-42af-9137-7438d7cd54df	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	1	39000	\N
b9819713-d850-4518-99b6-a0ee6412aec6	6f433206-c24a-4b0e-9357-8abe4604a04f	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	1	69000	\N
42d4ad6b-8a0a-4566-92cd-fb929a8865fb	6f433206-c24a-4b0e-9357-8abe4604a04f	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	2	96000	\N
629d06f2-fb83-4bc6-8bf2-11edbf2cb87b	6f433206-c24a-4b0e-9357-8abe4604a04f	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	3	45000	\N
3a6b19fa-0dc2-40d1-90cf-e5c66ac84407	4d36b689-fee0-4eaf-9dd1-6d4964709d38	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	2	108000	\N
df6e7a03-0d8f-4cc2-9778-c3f6e0b3847c	4d36b689-fee0-4eaf-9dd1-6d4964709d38	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	3	117000	\N
0623925d-f54e-4bf4-a6ab-bb521eac876f	4d36b689-fee0-4eaf-9dd1-6d4964709d38	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	1	39000	\N
c180ca7b-f3c7-4222-8e72-0cad40bebf07	4d36b689-fee0-4eaf-9dd1-6d4964709d38	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	2	78000	\N
737cad82-5224-491c-a20a-5e97252329c0	57c52e4d-1c9c-499f-974e-7f7223308522	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	3	117000	\N
310330ac-11be-4aa1-ab0f-4ac35fdf4c13	01c8bc9b-a775-4281-b20b-1a702b4add10	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	1	19000	it da
a2f6a567-c6d2-4a35-bfeb-42ad90180890	01c8bc9b-a775-4281-b20b-1a702b4add10	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	2	78000	\N
05a4c642-925d-43cb-9f23-88e5e544c9cf	e608075d-db24-4c68-9e1c-a0c74522a728	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	2	78000	\N
1ab30d27-856f-4ad0-a94f-9ace08b28997	e608075d-db24-4c68-9e1c-a0c74522a728	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	3	102000	\N
69119a36-9da6-491a-81f3-097e892a6d58	e608075d-db24-4c68-9e1c-a0c74522a728	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	1	54000	\N
8dbf050e-786c-4602-9286-2e31aa251040	05867d47-08b5-4b7c-9b42-6cf81267d55d	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	3	102000	\N
302fac27-1fee-44b6-a99e-b1073942d8a6	05867d47-08b5-4b7c-9b42-6cf81267d55d	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	1	48000	\N
3eb44368-bd3f-49a3-ac88-c891a8edfff6	05867d47-08b5-4b7c-9b42-6cf81267d55d	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	2	78000	\N
9b2bcce0-e7c6-47ff-8605-3a54259e0624	05867d47-08b5-4b7c-9b42-6cf81267d55d	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	3	174000	\N
2e2c3510-e409-45b4-920e-e538d3a1b72a	0e9cea5a-26c0-4a24-9b07-74676709b9cb	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	1	48000	\N
58663734-af63-420a-b5a0-86c4501d439a	04904509-4c29-427d-8133-c636bc48c51a	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	2	78000	\N
c1a98869-0997-4dfd-ac0d-28f885eacb66	04904509-4c29-427d-8133-c636bc48c51a	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	3	144000	\N
76b0277a-d950-49c6-9ef1-79ff4946862f	2171c3be-7de3-4162-bf16-85a77b7cde1e	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	3	117000	\N
c91abd66-42a4-493e-8701-dbb2eaefacb5	2171c3be-7de3-4162-bf16-85a77b7cde1e	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	1	48000	\N
b6949bf7-6755-48e3-b1f3-a65c16716a00	2171c3be-7de3-4162-bf16-85a77b7cde1e	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	2	108000	\N
a023e748-7702-41e1-8ac4-ab7cc1d53f2b	24744783-8606-4ab2-a135-c5c6ba8f3255	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	1	48000	\N
e615991b-e3a5-4b8b-8495-0c8308e6b6be	24744783-8606-4ab2-a135-c5c6ba8f3255	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	2	78000	\N
45cacd55-7969-48fb-b6c9-f349dce421c3	24744783-8606-4ab2-a135-c5c6ba8f3255	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	3	117000	\N
2f963b21-3ac1-4e31-a47a-23968d2146b0	24744783-8606-4ab2-a135-c5c6ba8f3255	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	1	19000	\N
535128fc-9028-4ec5-ba4d-809a505380ff	9fc8d012-1a7c-4fcc-a12d-e88c84a7fffb	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	2	78000	\N
b1fc813e-bfac-4351-9b80-a8d3df0bde18	e7abd5f1-6921-4d5f-aa0a-e1606a5c4b5c	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	3	144000	\N
0bd31383-00d9-45e6-bb1e-18c6e815def4	e7abd5f1-6921-4d5f-aa0a-e1606a5c4b5c	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	1	8000	\N
847d3b3f-1c84-41c3-bf41-6e6391e76a99	6b503c28-27d0-4ccf-b283-f09595b0ad8b	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	1	39000	it da
3d4addb1-d3c4-4704-99c4-de1a43b271ac	6b503c28-27d0-4ccf-b283-f09595b0ad8b	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
4e29ebca-1f7f-44d2-af72-00e2e8265f75	6b503c28-27d0-4ccf-b283-f09595b0ad8b	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	3	102000	\N
1af3440e-4030-4a06-a3d4-bf14c9ef3ef6	5d0858d8-29d0-42a6-8fa5-3f5f06b4fbad	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	2	38000	\N
7e18af3c-7b8f-4e4c-b9c2-0f57e7e7b37a	5d0858d8-29d0-42a6-8fa5-3f5f06b4fbad	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	3	117000	\N
198c7477-d37d-4602-b796-8502e4dc9322	5d0858d8-29d0-42a6-8fa5-3f5f06b4fbad	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	1	48000	\N
1d09260d-c138-49da-b30c-c6e08ecf26f5	5d0858d8-29d0-42a6-8fa5-3f5f06b4fbad	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	2	68000	\N
3ac6f0b4-e1c4-43d8-9c34-90e88a8875e9	0d9f6a7e-f5a1-460c-981f-3afe8e783cfb	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	3	87000	\N
f78a6d4f-729b-4205-a780-25bcb5bd9ee5	e631a883-feed-4a6e-8358-c21491fb9629	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	1	39000	\N
a1ce96d7-81aa-4cf3-8837-3aac97e1ee46	e631a883-feed-4a6e-8358-c21491fb9629	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	2	96000	\N
ac2a4c52-2b82-42ac-a764-2a5b4cf7dac8	a38fcc17-1238-45a9-8422-a7413616ef3d	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	2	96000	\N
197c33f5-5200-430a-9ebd-86f6a41318ec	a38fcc17-1238-45a9-8422-a7413616ef3d	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	3	117000	\N
2f021fed-e581-48c8-987e-7515d23e36a8	a38fcc17-1238-45a9-8422-a7413616ef3d	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	1	48000	\N
9f507d79-1cae-4fb6-98b5-3cd13997d191	a51d2ddb-07a1-4cec-9afc-2403bf25b617	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	3	144000	\N
fdffb7d2-90a7-4a5e-a808-eb8ec75dc666	a51d2ddb-07a1-4cec-9afc-2403bf25b617	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	1	45000	\N
2a5c9eaa-6dbb-444a-a932-2cf50d68d688	a51d2ddb-07a1-4cec-9afc-2403bf25b617	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	2	78000	\N
b48348af-51cc-4fd8-86f7-95da2ce203da	a51d2ddb-07a1-4cec-9afc-2403bf25b617	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	3	117000	\N
0810c209-2385-4aea-b086-6000f750eb98	d2298028-4cdc-4bf6-b933-3556146e556d	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	1	39000	\N
0d8fb1be-6a2f-4d78-a014-a70b0a7f6828	5073889c-90c3-4d8c-925c-f2c0504b2f13	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	2	116000	\N
d8c0e9b2-15d3-4ca2-a32c-4c03a5bf41d2	5073889c-90c3-4d8c-925c-f2c0504b2f13	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	3	144000	\N
6a1d0eec-39d5-4fe4-89ba-98bf50ae7afd	b45d611b-ee37-4238-adca-e84d116f61a7	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	3	117000	\N
3a0fb555-22a1-43fa-8450-e48be2d6d334	b45d611b-ee37-4238-adca-e84d116f61a7	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	1	39000	\N
93851ae2-efd0-4a34-bc28-381cd03c1f2f	b45d611b-ee37-4238-adca-e84d116f61a7	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	2	38000	\N
bd33a48c-6109-4cfa-bcd7-26365a23e74a	ac25c267-4234-46bb-88dc-f5638cf5aaad	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	1	48000	it da
b40d73ac-2359-4b43-afa7-08ba22935375	ac25c267-4234-46bb-88dc-f5638cf5aaad	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	2	30000	\N
ec3c64dc-93ba-4657-8308-3b22368aebd3	ac25c267-4234-46bb-88dc-f5638cf5aaad	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	3	87000	\N
f596ae58-1caf-4d55-93bc-c0412d6eb00d	ac25c267-4234-46bb-88dc-f5638cf5aaad	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	1	34000	\N
282df7ae-c38e-4fd9-af2d-7783b6a24911	eecb1872-7fba-4b1a-922e-4ca09f849fc9	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	2	78000	\N
c12a24c7-6854-466c-8ea9-6f2d003f641f	d597665d-0b96-43b2-b8a4-626efa31dd88	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	3	57000	\N
34342bb1-8eee-4d91-8504-eccb263cf9be	d597665d-0b96-43b2-b8a4-626efa31dd88	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	1	44000	\N
865fca6e-ae43-4cde-945a-0930b1d2a488	e1ff76fb-27db-4603-a126-56313bc2552f	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	1	39000	\N
c1a71ce1-ce05-42ed-8c1b-4d3d257708e9	e1ff76fb-27db-4603-a126-56313bc2552f	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	2	68000	\N
21f083dc-d650-471e-83bf-c94e924fc980	e1ff76fb-27db-4603-a126-56313bc2552f	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	3	144000	\N
dc841a0c-efa3-4070-84a0-c034b3cd4c0b	fd941889-5b8d-4408-92dc-ba1a16e1ebdb	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	2	68000	\N
4f8d95bd-5c9d-48a6-9b3a-26c5826ed93a	fd941889-5b8d-4408-92dc-ba1a16e1ebdb	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	3	162000	\N
6db03bdc-c140-43d5-aec0-f716a670ba58	fd941889-5b8d-4408-92dc-ba1a16e1ebdb	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	1	39000	\N
e5a69047-ab84-4fe8-b64f-4a1f89d9c0d6	fd941889-5b8d-4408-92dc-ba1a16e1ebdb	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	2	110000	\N
38840487-0318-4b04-b48e-b50143603500	7ad37714-4a1b-46e1-93f1-4f27582a95ba	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	3	144000	\N
6422f806-bfce-4993-9f60-553c8722d859	e30f647f-b890-435d-b364-b42f8868a5d5	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	1	34000	\N
061173f2-2785-4dba-890f-fbba46969826	e30f647f-b890-435d-b364-b42f8868a5d5	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	2	96000	\N
33c39b31-5f34-442d-9b61-afa3ffbbc1c0	a249e699-7f1c-4f4e-b327-9b14aa091005	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	2	96000	\N
337e843c-0240-4e27-a31e-d69f75310f2d	a249e699-7f1c-4f4e-b327-9b14aa091005	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	3	207000	\N
fe0cb9c3-b775-448f-9a2c-b4561532efda	a249e699-7f1c-4f4e-b327-9b14aa091005	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	1	48000	\N
c7b44323-0338-42a7-8a4b-25e2d2c1e561	25d587fb-6eec-4d00-83ca-e12b885ac741	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	3	144000	\N
d33c9833-77e0-406b-89e3-26b96c2911f1	25d587fb-6eec-4d00-83ca-e12b885ac741	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	1	54000	\N
ab4c51a5-bb78-4a64-82a3-a02557d0d5a0	25d587fb-6eec-4d00-83ca-e12b885ac741	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	2	78000	\N
03a3fcb0-6426-46c0-b948-cc6fd5b47ec2	25d587fb-6eec-4d00-83ca-e12b885ac741	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	3	117000	\N
f7d96b7a-1a10-4cb4-ab4d-30f6fb89fdfc	23c20332-2eb2-422d-9b45-e80333568a54	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	1	39000	it da
147691d4-bb8c-4c05-9a45-857df6f86bf7	38484833-7527-4ff4-8f4a-b3cf9c3bb06e	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	2	78000	\N
491750d3-8790-4dc4-8633-98223db58649	38484833-7527-4ff4-8f4a-b3cf9c3bb06e	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	3	57000	\N
973d23fb-9e2a-4bf1-975b-fa476cdb0a1d	2dcd2587-260b-4bb0-80aa-ceffbd556a40	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	3	24000	\N
b27dddae-c28f-4aeb-868a-3831ef6eaeea	2dcd2587-260b-4bb0-80aa-ceffbd556a40	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	1	39000	\N
ec1d806c-732c-49ef-afd2-275afbd49341	2dcd2587-260b-4bb0-80aa-ceffbd556a40	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	2	68000	\N
9fad5681-01e2-4e67-94f2-cfed725a95ee	42b1955d-66ab-4c9a-bf4d-646987bb9042	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
b6668b0e-641e-42e3-ae10-010bef107fac	42b1955d-66ab-4c9a-bf4d-646987bb9042	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	2	68000	\N
4c891815-bdda-4e32-879a-a27b547531ed	42b1955d-66ab-4c9a-bf4d-646987bb9042	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	3	144000	\N
2fb68723-e648-47ff-a20c-99c94295e845	42b1955d-66ab-4c9a-bf4d-646987bb9042	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	1	39000	\N
d508be8d-4603-4c19-8a16-063cf120e782	f3729edf-6bdb-40dc-b4bf-3b1c77b11316	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	2	78000	\N
2bebbc4d-9ab0-4abc-b4d0-0f6c4130bd41	6fec7006-04df-4613-b59a-88b7fd9f939c	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	3	102000	\N
968e1fb4-a559-44cb-8fc4-11dcdd4ab9f9	6fec7006-04df-4613-b59a-88b7fd9f939c	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	1	39000	\N
06357be1-7072-4784-8e8a-db9b382536e6	349e7821-dac8-4606-bff3-5f544297634f	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	1	48000	\N
e18c06f3-37f4-4180-ad27-bd54b01a8b0e	349e7821-dac8-4606-bff3-5f544297634f	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	2	78000	\N
12811102-8be8-48f7-a1d5-ee9d876e0845	349e7821-dac8-4606-bff3-5f544297634f	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	3	144000	\N
1c2008c8-7e88-4309-b70e-b47393fecf31	968e2fab-fa28-4561-9a29-8ab489799199	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	2	78000	\N
54cd24d3-b829-4fd4-aafe-769bc988616c	968e2fab-fa28-4561-9a29-8ab489799199	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	3	144000	\N
6a69788c-76f5-49fb-91ae-196422d1a3de	968e2fab-fa28-4561-9a29-8ab489799199	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	1	39000	\N
16405718-73c5-4466-9ca9-32ee2b0972aa	968e2fab-fa28-4561-9a29-8ab489799199	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	2	78000	\N
9750c3b6-98bc-4b8c-8c03-cd86ed10227f	85eb605a-0420-4ebe-ad1c-aec997975636	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	3	135000	\N
6c8b5ed9-bb36-4459-a6ad-d0ec9fd9a495	c4b9d619-dd92-4793-b958-cc07c7a1bf8b	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	1	55000	it da
41c1bc04-a3d2-402e-96a7-9b631630c427	c4b9d619-dd92-4793-b958-cc07c7a1bf8b	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	2	96000	\N
2081a697-bace-415e-9f70-95a970401182	790cb840-338f-4a18-9cb8-5efca019dad0	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	2	96000	\N
9bf6ed8d-abdf-4987-84f9-729239277559	790cb840-338f-4a18-9cb8-5efca019dad0	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	3	117000	\N
a9cc941e-7bc2-439d-9ee1-1383db2bd078	790cb840-338f-4a18-9cb8-5efca019dad0	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
31c783d1-a56a-40f7-9173-2bfac38a6ed1	9a627eef-e59f-4ceb-b591-c1d4fb6ca037	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	3	117000	\N
3cb74860-39cd-4123-8cee-e4b6d9ceb429	9a627eef-e59f-4ceb-b591-c1d4fb6ca037	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	1	19000	\N
a109e407-a033-4adf-a23a-c432644b869a	9a627eef-e59f-4ceb-b591-c1d4fb6ca037	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	2	78000	\N
e741c7ae-bfa9-4e17-89d3-83f73b622c65	9a627eef-e59f-4ceb-b591-c1d4fb6ca037	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	3	144000	\N
7c3ff684-e429-45ba-bbf3-29bc9ba2802e	88a6480d-6c42-4949-8355-8933e9f2d40c	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	1	15000	\N
facdd287-fda6-49df-8b92-6b971ec2ec16	027652d1-eec8-44fd-85c5-d306bd452c75	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	2	78000	\N
083bb106-7f8d-4ebb-8407-b346823bccb4	027652d1-eec8-44fd-85c5-d306bd452c75	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	3	117000	\N
76c069c7-9d26-4f40-b1e3-64f1b1fe987c	7e56f6e2-86a2-4178-bdde-4161372c81db	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	3	132000	\N
5f30c3d8-947f-4814-a86e-cc41058334cf	7e56f6e2-86a2-4178-bdde-4161372c81db	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	1	48000	\N
43f3b011-7d6e-4a84-b0dd-0d63f0f22f82	7e56f6e2-86a2-4178-bdde-4161372c81db	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	2	78000	\N
258cb4e7-2f9b-49dd-b50c-b17ea0e1c01d	2e71d7dd-1da9-4f97-96e3-dc006647cfb6	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	1	34000	\N
f74b8096-53fa-41ab-9308-3364730746e7	2e71d7dd-1da9-4f97-96e3-dc006647cfb6	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	2	96000	\N
2e7db6da-7f70-48de-819c-ab12906a347d	2e71d7dd-1da9-4f97-96e3-dc006647cfb6	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	3	135000	\N
601fb271-0da9-46af-ba40-344dae5243c2	2e71d7dd-1da9-4f97-96e3-dc006647cfb6	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	1	39000	\N
ab85798c-6c5b-4c57-8db8-8757bb117c6e	e88c02c9-729e-45aa-bf56-a3d562783adb	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	2	108000	\N
94f0dbed-9223-42b3-8f52-1f404293180f	e137773f-3bee-4f1a-9de7-55c778ca0581	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	3	117000	\N
7fdb1677-d4aa-4788-9645-c4c782687217	e137773f-3bee-4f1a-9de7-55c778ca0581	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	1	58000	\N
65540cab-1062-4292-a27f-555cce0966de	86f74558-12cf-4808-97f7-b81f552f2c83	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	1	48000	it da
2c4d95f6-2b75-493e-ad2a-b63efc11b306	86f74558-12cf-4808-97f7-b81f552f2c83	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	2	78000	\N
399b6301-803f-49e1-a0b5-ba5891d54b47	86f74558-12cf-4808-97f7-b81f552f2c83	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	3	117000	\N
cba349b7-870c-45d3-968e-dd3d265e63ae	e60cb863-d41d-48d1-863f-8b07800cc18f	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	2	138000	\N
f75d1a56-19d7-447d-a1fa-b35e7418d788	e60cb863-d41d-48d1-863f-8b07800cc18f	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	3	144000	\N
b5918340-88cf-4875-bf4e-94c475a4b0af	e60cb863-d41d-48d1-863f-8b07800cc18f	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	1	15000	\N
4913ce34-6d82-46ee-a159-5894c459347b	e60cb863-d41d-48d1-863f-8b07800cc18f	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	2	58000	\N
359e21e7-3336-4b38-ad75-342bb24c545b	7f8818bf-08e7-4d81-a371-9d58bd4abfc8	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	3	162000	\N
7fbd6ecd-f0ed-481c-91c7-e75b053ec0fe	79365398-fb1e-4df8-8a7c-98094626d5fb	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	1	39000	\N
d34a4a8f-6483-4e0b-be49-15f4c6928fc8	79365398-fb1e-4df8-8a7c-98094626d5fb	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	2	38000	\N
9586c44f-9d24-46ea-a68e-e07bb534c933	ca2ec2e6-c627-4408-ba87-27337e1453c1	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	2	38000	\N
f8fa9d7e-9014-4452-b13d-fc4596b1a6eb	ca2ec2e6-c627-4408-ba87-27337e1453c1	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	3	117000	\N
cbf020cf-08b8-48ac-86d8-2ff54fb3fcf0	ca2ec2e6-c627-4408-ba87-27337e1453c1	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	1	34000	\N
9665a29b-55d9-4dae-893e-339c92d2aec3	b86df68d-9472-4e47-a223-5170b34917bb	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	3	117000	\N
53c15d8b-c184-48a5-bdcc-86e7c9757092	b86df68d-9472-4e47-a223-5170b34917bb	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	1	34000	\N
c368079f-61ef-4130-a5ed-d21e5917f555	b86df68d-9472-4e47-a223-5170b34917bb	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	2	108000	\N
e486ecaf-3688-4608-86ab-579833529fdc	b86df68d-9472-4e47-a223-5170b34917bb	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	3	117000	\N
92e7732e-2247-4742-a519-1a9c6f236837	ad4f97f1-9212-4dd5-bdd2-13c8ced41a67	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	1	34000	\N
01a39a31-e9a9-4072-8f4c-2938af734760	2245ec02-1c83-41a9-98b9-2646e23d33a5	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	2	96000	\N
b547efb9-44b7-430c-8ef0-13c6578e11a8	2245ec02-1c83-41a9-98b9-2646e23d33a5	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	3	102000	\N
6a7fc264-f42d-4ec3-bf93-3766debf1629	a04910ff-ee68-4e08-a507-f099ad2e8b96	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	3	117000	\N
df340121-16b8-475d-9a2a-7030e4c23689	a04910ff-ee68-4e08-a507-f099ad2e8b96	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	1	48000	\N
d7c2170c-eada-4f4a-a660-8c3f167a8ee7	a04910ff-ee68-4e08-a507-f099ad2e8b96	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	2	138000	\N
bef2621f-1478-4bb2-8204-87e793bb1137	e3acce38-c5cf-4f2c-8b79-14c2a9a20c36	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	1	39000	it da
16b7353e-305a-42a2-a8c7-fb846e314100	e3acce38-c5cf-4f2c-8b79-14c2a9a20c36	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	2	96000	\N
86781a5c-312e-43dd-a22c-8317b2f11a19	e3acce38-c5cf-4f2c-8b79-14c2a9a20c36	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	3	162000	\N
0aaaf48a-14a5-48cc-bbea-f73612ecb89f	e3acce38-c5cf-4f2c-8b79-14c2a9a20c36	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	1	39000	\N
16387745-7fdc-46d2-b798-3c42d1be24e3	5f1d4e27-bf17-4d5f-817a-9cc4805d0b88	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	2	96000	\N
aeda3379-23f4-4b63-9ea8-21191769ac4c	60df636e-8775-468f-a1dd-2d3863df1e19	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	3	117000	\N
9d906267-7fc2-4bb2-b695-4c5b4db32f9a	60df636e-8775-468f-a1dd-2d3863df1e19	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	1	39000	\N
a7278cee-b69f-4674-851e-fd892bdddec0	728c80fc-3191-4910-8372-d5df87c45d64	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	1	48000	\N
db5aa411-1223-44b5-9e0b-5b8b110ae720	728c80fc-3191-4910-8372-d5df87c45d64	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	2	16000	\N
4ae015e2-0344-402f-a44e-809f017d728e	728c80fc-3191-4910-8372-d5df87c45d64	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	3	117000	\N
badba07e-b6c1-4637-9183-851c3ff0267c	ba16f164-c6ab-45a1-b9b1-9742a40623d9	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	2	78000	\N
80d7c5ef-cc07-4638-895d-24e951b56f16	ba16f164-c6ab-45a1-b9b1-9742a40623d9	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	3	117000	\N
f2fb3a26-d107-4f3c-8136-06e8d4b63495	ba16f164-c6ab-45a1-b9b1-9742a40623d9	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	1	34000	\N
0e2c3b0c-5288-42e2-aae9-c573e0657e40	ba16f164-c6ab-45a1-b9b1-9742a40623d9	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	2	96000	\N
d7638be8-c977-47d0-8a3f-58a107d02118	2fa5104d-d411-47dc-8163-1f24d2794383	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	3	57000	\N
998bb928-3c1a-4d41-885c-2e84476cc327	ff856eb3-eb12-493f-9cbf-a07b2f44f54b	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	1	29000	\N
9938d1b2-443d-4b24-b519-337aecb06955	ff856eb3-eb12-493f-9cbf-a07b2f44f54b	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	2	68000	\N
3cdd64b5-5424-408f-8f27-90053c029555	18b3516e-fb21-4e77-9527-79b1e22d56fc	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	2	78000	\N
5a246d40-9b3e-49aa-bd11-786d9586e8f6	18b3516e-fb21-4e77-9527-79b1e22d56fc	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	3	144000	\N
5509fca4-ba60-4aad-b040-20ae57104029	18b3516e-fb21-4e77-9527-79b1e22d56fc	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	1	39000	\N
cd4baede-1ece-49fa-bcac-d9cf208e8cd3	3ce095d5-e970-4d35-a317-3faae1c865f9	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	3	144000	\N
f84ab876-e20c-44ce-8037-a2254efd7805	3ce095d5-e970-4d35-a317-3faae1c865f9	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	1	39000	\N
59687249-3560-4eaa-b46d-9bb55c5e3784	3ce095d5-e970-4d35-a317-3faae1c865f9	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	2	96000	\N
08ade7b9-76ba-4ca8-8726-aab0faf59c1d	3ce095d5-e970-4d35-a317-3faae1c865f9	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	3	117000	\N
0d31a3d8-8634-4aa4-886d-b288cac7e6b4	efbce400-9601-4e48-bf62-0c3c7138771a	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	1	48000	it da
ac7157b2-cb91-4722-91ea-3edba05102a1	a959b675-08f3-4a90-956c-e0eeb9e30a2e	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	2	78000	\N
33bcccb3-b4a1-4db7-a290-6dfc0ab1e7ce	a959b675-08f3-4a90-956c-e0eeb9e30a2e	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	3	165000	\N
ce281252-ab2f-45f0-8290-d79b3f5b01c7	faef74eb-ec4f-4e0f-8b79-f8cfeada2260	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	3	174000	\N
8d9dd67d-5f6b-46bb-b42e-0f7e3d8958a3	faef74eb-ec4f-4e0f-8b79-f8cfeada2260	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	1	48000	\N
47331885-8b57-42f9-b60b-5a680c53070c	faef74eb-ec4f-4e0f-8b79-f8cfeada2260	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	2	78000	\N
808f81ee-6a32-4328-9a02-53febb6dfcba	0f848081-92c1-4db8-86fa-b04f216e6367	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	1	39000	\N
36fbeeab-30e4-4802-b741-8736aefe16c4	0f848081-92c1-4db8-86fa-b04f216e6367	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	2	78000	\N
7ea794b8-7999-4e13-b8fe-a077e83e9704	0f848081-92c1-4db8-86fa-b04f216e6367	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	3	57000	\N
40294e15-4b17-4656-ac11-e9b9d5c34308	0f848081-92c1-4db8-86fa-b04f216e6367	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	1	39000	\N
648590c1-c556-425f-8ac5-5e2595ed1e55	60878188-16fe-4181-a2ce-5f5a5bdeed49	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	2	96000	\N
4cd935cc-32bf-4c3a-8c76-7dafe6d4301b	2d49538f-ee34-4b0b-a459-0fe3c722b42e	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	3	117000	\N
a06f54a9-186f-4034-bf77-daa28ba6ce1a	2d49538f-ee34-4b0b-a459-0fe3c722b42e	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	1	39000	\N
3bb186ea-cbd9-4f8e-ab2e-0d47871207cc	b128e44f-2fc0-4573-84f1-6ee2e2fa899a	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	1	19000	\N
8616b545-2b02-4a5d-9f77-4cb4feef7460	b128e44f-2fc0-4573-84f1-6ee2e2fa899a	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	2	88000	\N
d328a4c2-a50e-402a-a9af-8e78ad21012e	b128e44f-2fc0-4573-84f1-6ee2e2fa899a	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	3	144000	\N
3869506a-58da-4e64-8bc8-2652b738bd16	10018420-af21-4861-a769-8069eb2cbc80	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	2	78000	\N
cdbb5c54-ff0c-4b84-821b-70d83617569b	10018420-af21-4861-a769-8069eb2cbc80	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	3	102000	\N
9a2ca450-382b-440a-b74e-44d0e979a738	10018420-af21-4861-a769-8069eb2cbc80	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	1	48000	\N
e2d7c961-f38d-4eb3-90ed-c6d4904a5459	10018420-af21-4861-a769-8069eb2cbc80	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	2	90000	\N
9ad7ea2a-9ee4-4bfc-b44c-ec446fdb440d	0e338e9e-956d-4880-bd9a-ce0a9d71545d	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	3	102000	\N
ff64c5d5-cfd0-4448-9b1a-34755d83633a	5b33b8c5-99d5-4cf0-8179-98e692b4e96e	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	1	48000	it da
760c9376-4a3a-4e8d-851d-54ec95e43618	5b33b8c5-99d5-4cf0-8179-98e692b4e96e	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	2	78000	\N
46ec2310-2799-48e4-8847-cd293fe45171	d80b15ca-37bf-41b6-8af8-7c3e15b2dde1	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	2	68000	\N
71ca86f3-86d4-4e49-98da-38e46b10fa1d	d80b15ca-37bf-41b6-8af8-7c3e15b2dde1	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	3	144000	\N
7357421c-cc06-4a98-84c8-6a1165cbf503	d80b15ca-37bf-41b6-8af8-7c3e15b2dde1	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	1	39000	\N
9d08dbe1-d5c9-4564-98d9-eba5ad0d0054	df4ebe13-2078-4d6b-9ce0-68eeb783b167	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	3	144000	\N
348278de-8521-44c5-b86a-ef29d28a0d2e	df4ebe13-2078-4d6b-9ce0-68eeb783b167	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	1	69000	\N
6d35835c-b965-4b0d-8d8f-4b85ceba0157	df4ebe13-2078-4d6b-9ce0-68eeb783b167	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	2	96000	\N
676df6e3-aa7e-4b80-8ea6-d9f1f39f0bb2	df4ebe13-2078-4d6b-9ce0-68eeb783b167	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	3	45000	\N
7540ff65-0dce-4ca5-b599-2dc5ae41b8a0	e3c82763-4f69-4f0f-86a6-03f45589fb57	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	1	48000	\N
81cf7724-1a5d-4957-8c8c-744d6be69451	cf25e11e-8170-4a9d-860d-0774c50e9caa	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	2	78000	\N
1120dee5-a8a6-4807-985a-f9c8bda7acff	cf25e11e-8170-4a9d-860d-0774c50e9caa	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	3	117000	\N
c84ea5c1-a13b-4703-9f52-ec31b357684f	2f2e882d-6b1b-4dc9-b96d-b0a3bc25e26e	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	3	117000	\N
969adaee-9a94-4c41-af37-6d46adda9b71	2f2e882d-6b1b-4dc9-b96d-b0a3bc25e26e	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	1	19000	\N
0b778e73-2cf5-45e4-8977-fbe9aa292417	2f2e882d-6b1b-4dc9-b96d-b0a3bc25e26e	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	2	78000	\N
9527d69e-f308-4bca-974a-3c044599d37f	973cf85c-47e8-48ca-b9b8-7cc930d257ae	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	1	8000	\N
02c57365-f4e2-4a5d-84f5-8001ea36a1ed	973cf85c-47e8-48ca-b9b8-7cc930d257ae	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	2	78000	\N
d2fe61bb-0e37-40b5-8f43-c43e1a71ed02	973cf85c-47e8-48ca-b9b8-7cc930d257ae	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	3	102000	\N
defa7e01-126d-4477-badd-776fc37b48ce	973cf85c-47e8-48ca-b9b8-7cc930d257ae	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	1	54000	\N
474935f7-0cbf-48c9-b707-a3f61ec6f21a	5b033109-5b49-4d46-9f58-d6a110092d95	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
6dca15f9-a386-41a1-b5d0-c867a7e7e6c4	2397b108-90ed-4203-82d3-24f28e3265b8	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	3	117000	\N
cccc29bd-b03f-42ef-aff0-976b16a35766	2397b108-90ed-4203-82d3-24f28e3265b8	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	1	48000	\N
49391c5f-de09-4f25-8b97-5702ea1de2de	5596d42e-adb1-444a-9ad5-2d8405e82a94	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	1	34000	it da
480ebe9a-65ee-4ec4-b8d5-61b97d08a709	5596d42e-adb1-444a-9ad5-2d8405e82a94	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	2	78000	\N
087f045b-c726-4457-a647-085eb7f16cad	5596d42e-adb1-444a-9ad5-2d8405e82a94	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	3	144000	\N
dea3524b-976a-4581-9c0e-2c2988b12810	e78383ec-4003-45a9-8bd1-be27e80bbaa9	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	2	96000	\N
ed5b84f8-6cff-4c93-a3ef-05339135e5a4	e78383ec-4003-45a9-8bd1-be27e80bbaa9	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	3	117000	\N
686c37e8-a58c-4444-a242-20cc5601652c	e78383ec-4003-45a9-8bd1-be27e80bbaa9	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	1	48000	\N
f348a907-1e58-4b7b-9a13-ab0896124233	e78383ec-4003-45a9-8bd1-be27e80bbaa9	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	2	108000	\N
619744b3-0a71-4f06-a0c6-165cdb7b4303	6ff51ca2-2234-49f0-8ea8-845ff604863c	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	3	117000	\N
bf543bdc-485a-4fb9-b30f-8e13a8fd5f22	491224b4-67b6-4949-a6f0-aabe7948b8c5	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	1	45000	\N
a6da78ea-f345-4867-ae50-99436d7fdeda	491224b4-67b6-4949-a6f0-aabe7948b8c5	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	2	78000	\N
35cfd0ac-d3b8-4877-aa89-ab7f3a49d535	9ca5cfc1-acf0-4306-8dcc-b6e8c13f4b1d	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	2	110000	\N
74f8a569-987c-4883-a59c-5fa7c5197885	9ca5cfc1-acf0-4306-8dcc-b6e8c13f4b1d	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	3	144000	\N
f46f2481-6385-4e06-9a26-3dccc09c028d	9ca5cfc1-acf0-4306-8dcc-b6e8c13f4b1d	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	1	8000	\N
36f5d48b-ded4-4d83-8650-34fee20c00e9	d56300b7-c443-4c06-b63d-75abd3d0102b	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	3	144000	\N
697358f4-60cd-4622-8b72-282fe4511af4	d56300b7-c443-4c06-b63d-75abd3d0102b	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	1	39000	\N
4bf36d97-0021-4a07-908e-1661655247c6	d56300b7-c443-4c06-b63d-75abd3d0102b	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
237ef4f0-6c88-4447-887b-fc9518afa755	d56300b7-c443-4c06-b63d-75abd3d0102b	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	3	102000	\N
aeaccb66-b530-4d57-8694-31786b990a0e	4ffd3151-5e32-4822-b12d-78b23a830405	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	1	39000	\N
8fc652d7-b9d5-49fd-b849-1e1fa390b330	6e0f4622-08d5-44f9-bc6c-218a3012596a	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	2	30000	\N
70ed9f7a-ad80-4345-92ca-899ff585f040	6e0f4622-08d5-44f9-bc6c-218a3012596a	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	3	87000	\N
e2666ba5-4b82-4739-abeb-997d586e23a3	42afde2f-2634-4839-ae2e-8bc3d385a1ad	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	3	117000	\N
270ec367-d269-47f2-9c36-da73c0cab853	42afde2f-2634-4839-ae2e-8bc3d385a1ad	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	1	39000	\N
d9aecea1-786c-4dd5-a87f-02a74f73fa42	42afde2f-2634-4839-ae2e-8bc3d385a1ad	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	2	96000	\N
0c560aa1-e02f-42ba-aa9f-3013d42194be	b17b5499-7f54-4ead-bad8-0790316fc0a5	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	1	44000	it da
e860b206-9fab-47fb-b8fa-2805ee90f6cc	b17b5499-7f54-4ead-bad8-0790316fc0a5	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	2	96000	\N
dfca55bc-eb03-436e-a938-67e9483b6a50	b17b5499-7f54-4ead-bad8-0790316fc0a5	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	3	117000	\N
5562b3b3-13c3-4d97-b928-57b40086ab6a	b17b5499-7f54-4ead-bad8-0790316fc0a5	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	1	48000	\N
f3ba5471-7bda-4cf6-ae9b-fa09bddfc38f	cb6d5293-5a30-42b9-a3f7-528f10c95446	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	2	68000	\N
c4a466f3-ed1a-412d-becd-c768ceb5512d	cae16fd7-0499-4147-9ab8-9afb478f61b7	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	3	162000	\N
4a1a9bf7-efe2-46ba-ab6c-18c9a8b4baa8	cae16fd7-0499-4147-9ab8-9afb478f61b7	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	1	39000	\N
dd44b559-7ab3-4058-8a2c-8d1285e0a186	0d93aaf7-76d9-4e71-9bdd-c06b5f237ad2	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	1	39000	\N
ed108c95-875e-4cb1-bd56-506219c1bf44	0d93aaf7-76d9-4e71-9bdd-c06b5f237ad2	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	2	116000	\N
008b5073-529d-4178-b8cb-5a2535e55178	0d93aaf7-76d9-4e71-9bdd-c06b5f237ad2	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	3	144000	\N
8310b115-35a9-4448-98fe-cf69a1a6487c	2c64dab6-f753-43ca-bc90-3c65e373c97e	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	2	96000	\N
50fcd37a-2581-4cae-a48d-ee868d84748d	2c64dab6-f753-43ca-bc90-3c65e373c97e	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	3	117000	\N
012f89f2-0e86-444f-992f-7360ae20064d	2c64dab6-f753-43ca-bc90-3c65e373c97e	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	1	39000	\N
2ab17cde-732a-4d62-a883-12bc16b5defa	2c64dab6-f753-43ca-bc90-3c65e373c97e	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	2	38000	\N
1e162acf-86d0-48bf-b1a8-fa9a5a03028c	d4d35487-ec82-4e6b-88e0-d469b48a224d	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	3	207000	\N
fa0bf519-b4c0-4c29-8af5-0308179321a5	8f873823-a697-4729-82ab-6cf037419229	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	1	54000	\N
db37ba99-24f9-4288-80d0-2dcae8ef6c05	8f873823-a697-4729-82ab-6cf037419229	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	2	78000	\N
960f0459-0b1d-4d61-a675-8a6282e907d2	360ef10e-31d4-48ba-8722-688929a90c20	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	2	78000	\N
e02b6c50-ba7e-42d9-9788-2c841a43d542	360ef10e-31d4-48ba-8722-688929a90c20	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	3	57000	\N
3b027286-10c8-449a-9d43-bf369f762307	360ef10e-31d4-48ba-8722-688929a90c20	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	1	44000	\N
7abbc732-e62b-4e75-9ad0-40983baf7085	ae5c61fd-1454-4be4-9569-7163c7ca9aad	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	3	57000	\N
e528c4d5-02d6-44fc-9dde-0b81abecb1e2	ae5c61fd-1454-4be4-9569-7163c7ca9aad	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	1	39000	\N
a808a9f6-6ac9-45c9-b3eb-80e1d95718ad	ae5c61fd-1454-4be4-9569-7163c7ca9aad	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	2	68000	\N
3d80c770-095b-48dd-a4e6-21e34393d007	ae5c61fd-1454-4be4-9569-7163c7ca9aad	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	3	144000	\N
6e8f5288-88e6-4a18-a340-1476cb6a575d	f3967700-6073-452f-adaa-2c7ad837dd8a	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	1	39000	it da
b8cb5771-1357-409f-a9aa-684f9e34549a	2acdde15-c4b7-44d2-9459-43e164e91768	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	2	68000	\N
9b88f296-0e8a-4195-9aef-a0034878ae59	2acdde15-c4b7-44d2-9459-43e164e91768	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	3	144000	\N
e6d3592c-15ec-4152-8714-b5d985ecc559	e7658f0d-775e-4c95-a90c-508c7708da52	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	3	144000	\N
3e72b7c5-b268-4f09-9b67-874221f962fe	e7658f0d-775e-4c95-a90c-508c7708da52	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	1	34000	\N
dcb25ab0-a1c5-4567-9ade-6831feae72ce	e7658f0d-775e-4c95-a90c-508c7708da52	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	2	96000	\N
f02b415e-6ddb-44d4-afce-5d751dca4861	eb95e40b-1d7d-46ba-b7c4-7532429a799e	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	1	39000	\N
caeafcce-bf0f-476a-a194-04eac66879e1	eb95e40b-1d7d-46ba-b7c4-7532429a799e	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	2	96000	\N
7a67495e-604c-4711-94e2-b32dd81b8a5d	eb95e40b-1d7d-46ba-b7c4-7532429a799e	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	3	207000	\N
8de8c260-a4c8-4854-8cff-152b80857cc1	eb95e40b-1d7d-46ba-b7c4-7532429a799e	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	1	48000	\N
b586cf9a-d96a-4014-903d-44281c1fdfb0	01e10756-c7b3-4536-bb3c-35643c3f4cf7	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	2	78000	\N
6a4ecd23-8227-48be-945f-64413192c31c	3a4e6677-308c-4c1f-a87b-9b693620a5a7	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	3	144000	\N
d42c0aa6-fda7-4019-a488-f724f4b1b52f	3a4e6677-308c-4c1f-a87b-9b693620a5a7	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	1	39000	\N
9da55f66-a783-4023-a6df-3252abb4c4ca	966fbd84-9f46-4c83-ac86-167ec5a4fdea	6ec836b1-483e-4125-a2fa-3261bbb6a2a9	Nuoc Ep Dua	\N	39000	1	39000	\N
49c9ad18-5838-42fb-b22a-ff5b2b38127a	966fbd84-9f46-4c83-ac86-167ec5a4fdea	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	2	78000	\N
70f5e212-b623-4902-969c-fa15a5e66e9a	966fbd84-9f46-4c83-ac86-167ec5a4fdea	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	3	57000	\N
d636d7f5-8334-4f71-be4c-9dd91a4c1d02	5a39b9e7-80d2-4617-900e-7f9d60030176	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	2	96000	\N
50c755d1-4a01-4d2b-951a-3cbb107575a8	5a39b9e7-80d2-4617-900e-7f9d60030176	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	3	24000	\N
fb66c692-7424-4831-8d9b-c552c42c7a49	5a39b9e7-80d2-4617-900e-7f9d60030176	988db5b6-220b-4523-acbf-63f2b5a704ec	Chalo Coffee Dac Biet	\N	39000	1	39000	\N
bd97aa88-8cbd-4476-8285-94ca22aa4fcd	5a39b9e7-80d2-4617-900e-7f9d60030176	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	2	68000	\N
4d942360-b0fe-4ad4-8bc6-b4c68b05b97c	bc79859a-0f04-4ab1-9995-f28f3c486ebb	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	3	117000	\N
6ac9a442-3375-4aad-9ed3-62507d11bc3e	5b3efa4e-479b-43d9-8b09-c0382bf1e81d	b63887ff-87f2-486b-ad9e-fbc5511844b3	Kho Ga Kho Bo Kho Heo	\N	19000	1	19000	it da
19bbf28f-dd98-4d38-9ebc-4b8896adb2b1	5b3efa4e-479b-43d9-8b09-c0382bf1e81d	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	2	78000	\N
6a0ee253-b12f-4976-ab58-d8745372eee5	500fae9f-d986-479c-9045-d34336eb40e7	c6596b7d-39d4-4637-a692-15bf6b08b02e	Chalo Coffee Den Nau	\N	29000	2	58000	\N
4fd7925a-5531-4805-a592-c6568dba8e47	500fae9f-d986-479c-9045-d34336eb40e7	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	3	102000	\N
3d594300-7633-47da-80b2-0d3ad699b66e	500fae9f-d986-479c-9045-d34336eb40e7	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	1	39000	\N
c8c034be-6945-4794-9bc1-06caf5678eb2	1f4023d8-fce5-4bf9-a41d-096418a87a14	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	3	117000	\N
a2d620b9-c388-4ac6-b813-b0671b2c93c1	1f4023d8-fce5-4bf9-a41d-096418a87a14	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	1	48000	\N
7dc6cbe4-34a7-4b3c-981b-67e5b5eb2245	1f4023d8-fce5-4bf9-a41d-096418a87a14	fd530e34-adf8-429e-86ea-a82e764cc969	Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	2	78000	\N
f4373b42-1041-475a-8e64-ce9e97bd84b4	1f4023d8-fce5-4bf9-a41d-096418a87a14	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	3	144000	\N
0da848dc-8aa2-448d-9e1d-919dce31d649	80572696-5775-4600-a4d7-5f70dec3d4e8	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	1	48000	\N
9756ff5f-4956-4bfe-9c37-d80d8bc97a12	9ee83de7-5994-4be3-9240-601f5fc64726	200acb2a-70d5-4d67-874f-0a0b0d063436	Matcha Tra Sen	\N	48000	2	96000	\N
5be81166-49c5-444c-8a38-a2f2600ae446	9ee83de7-5994-4be3-9240-601f5fc64726	fab37b98-ccfc-407a-a3f5-ba7e7f905264	Tra Cu Chalo Dam Vi	\N	45000	3	135000	\N
6bfe4963-4c5a-4b89-827c-484d4a6e85f8	a4c577cc-5c4a-4e9d-a724-027568d78d19	96e64c37-45c5-445f-9d69-e9045847be16	Tra Dao Cam Que Nong	\N	39000	3	117000	\N
7512eadc-4b8b-4bfa-8301-cb209ed8275b	a4c577cc-5c4a-4e9d-a724-027568d78d19	1b1829c3-8f31-4bb5-9fad-fcf7f094d496	Sinh To Sua Chua Mat Ong	\N	55000	1	55000	\N
86cd4131-bf01-46e8-b278-eb1545e42043	a4c577cc-5c4a-4e9d-a724-027568d78d19	dccd90cd-5d97-4729-acc1-c9079a3b2a24	Bay Lac Cung Chalo	\N	48000	2	96000	\N
871ae6c5-8d38-4433-8ed1-a02c501fcfda	540a139f-d00a-4e33-825e-3c595ea0cd15	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	1	58000	\N
356efb1c-bd12-47ed-a598-8548622e74ec	540a139f-d00a-4e33-825e-3c595ea0cd15	701776fb-649f-4d96-bff2-49c4f86301a8	Nuoc Ep Luu	\N	48000	2	96000	\N
a4766622-5339-44f5-b61f-65e51fd8062f	540a139f-d00a-4e33-825e-3c595ea0cd15	92f6430c-9ca3-4aa7-96df-72ff2a156bfb	Sua Chua Viet Quat	\N	39000	3	117000	\N
5cf62453-de36-4465-b6f6-064dfa2aa033	540a139f-d00a-4e33-825e-3c595ea0cd15	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
a9b289ce-9426-4949-91a1-5089ddb117e8	218316c3-4b6e-4ef3-ad73-83ab682c68f4	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	2	78000	\N
59666080-5947-4f4d-a562-89f233b55f9d	e4d8b827-770e-406a-a3b1-1c1e411a4607	626b2101-5a08-41bf-92c4-8c4036fdbf05	Chu Cuoi	\N	48000	3	144000	\N
99cc5622-f5ff-43e7-aff8-7c020a2c07ed	e4d8b827-770e-406a-a3b1-1c1e411a4607	a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	Hat Huong Duong	\N	15000	1	15000	\N
4e064aba-5246-4ab6-8ab1-5f54bd06a171	4d7e8a4a-621b-470d-b75a-38f6256ca0ba	abf1ca96-26fb-4d12-a7ef-96303f28704f	Sua Chua Dua	\N	39000	1	39000	it da
8e265c63-07a7-4fb3-ba3b-59894e2c44bc	4d7e8a4a-621b-470d-b75a-38f6256ca0ba	833e2485-0cd8-40f0-b222-1702c68c43d3	Capuchino Lanh	\N	39000	2	78000	\N
0a390ce0-d45f-4f41-9122-689996d14925	4d7e8a4a-621b-470d-b75a-38f6256ca0ba	4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	Cacao Kem Muoi	\N	39000	3	117000	\N
89c33702-3925-401e-8a9d-06cac4ce64b0	96a00868-6cdc-4e53-a947-71efaad5de26	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	2	38000	\N
a33587cc-7497-472c-b368-5b38fdcf290c	96a00868-6cdc-4e53-a947-71efaad5de26	b2578b52-864a-435f-a7bd-c63d182c0e93	Ca Cao Sua Dua	\N	44000	3	132000	\N
2e248f47-6095-4306-b8f6-90a4a9a5abda	96a00868-6cdc-4e53-a947-71efaad5de26	84a4f1d1-4fcc-4642-ac48-16d12841f9b8	Dai Duong Xanh	\N	48000	1	48000	\N
88592d20-110c-4a4e-ad99-24e11f9ef4a2	96a00868-6cdc-4e53-a947-71efaad5de26	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	2	78000	\N
c8480f5b-6870-4f81-865c-116c67891b45	0f949dcc-a3c5-4894-bd48-dc9ea1129695	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	3	117000	\N
8ddf06bd-8f7e-4b3c-a9cc-d1cda09fe973	e1aed205-677d-4482-81f1-e75721d09266	b7c8f3a2-0494-4417-b871-5e687e7a919d	Ca Phe Bac Xiu	\N	34000	1	34000	\N
ab4f1424-6b52-47b1-8e5d-53054761d8f4	e1aed205-677d-4482-81f1-e75721d09266	8f714059-5383-441c-b0e0-7204b813ac3f	Hong Hai Nhi	\N	54000	2	108000	\N
0562e227-6f41-4f95-9d4d-d83269101497	9d5ead4e-989c-4d5e-84ee-5d720335fde6	77b1a449-5699-4660-8a4e-6219cd2367ae	Thao Nguyen Xanh	\N	48000	2	96000	\N
a12db567-15fb-4451-bc10-a14d6f6d6757	9d5ead4e-989c-4d5e-84ee-5d720335fde6	6536b909-e896-4b45-a718-bd32957079b8	Tra Sua Chalo Viet Quat	\N	39000	3	117000	\N
a63abc87-74ca-4689-8fde-8ad7655e035c	9d5ead4e-989c-4d5e-84ee-5d720335fde6	3b0030ad-e18f-4a53-bd08-3d9264c306e3	Sac Xuan	\N	58000	1	58000	\N
91d480ad-2328-466e-b545-3a5dba1c654b	941031da-369c-4d90-9d12-c1e32d8f7eea	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	3	102000	\N
e4e8fe19-b884-40f7-8b2f-4f0558e5e41b	941031da-369c-4d90-9d12-c1e32d8f7eea	3c4f01bb-5e5b-431f-b492-2f615ef579a2	Phuong Hoang	\N	48000	1	48000	\N
b5be50c2-1e0c-4a2e-ac2c-99cc7bb37436	941031da-369c-4d90-9d12-c1e32d8f7eea	c9dee998-960c-4fba-b13d-03fd01bfe465	Nuoc Ep Dua Hau	\N	39000	2	78000	\N
640e46b2-d30a-4061-8a7e-90ff90e384f8	941031da-369c-4d90-9d12-c1e32d8f7eea	2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	Sua Chua Ca Phe	\N	39000	3	117000	\N
daa2d424-2989-4999-ab0a-70d54927586a	37e5fb34-f55a-4d9b-8c7c-7b85910e8e5b	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	1	48000	\N
6f47cda7-42b9-461c-9567-5022a86d8e59	485a5db2-20d5-454e-97e8-67d8d17e3aa4	fef374cf-9486-4dc9-aacb-02ebf30a6cab	Sinh To Trai Cay Theo Mua	\N	48000	2	96000	\N
48a3035f-dd26-4d6a-a0d7-c868ff2008c3	485a5db2-20d5-454e-97e8-67d8d17e3aa4	60cdd4b1-569d-4c49-b97a-dda6fc8d478e	Trang Non	\N	54000	3	162000	\N
181daa31-26d7-4998-8d05-92ce783803fc	96e87606-370a-421b-8dea-6249bd3e29ca	2ed6795b-47b9-4e49-8780-7f6ed2d04bff	Nuoc Ep Cam	\N	39000	3	117000	\N
12bea4f1-3711-426e-bc6c-9889ea30bd35	96e87606-370a-421b-8dea-6249bd3e29ca	b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	Sua Chua Xoai	\N	39000	1	39000	\N
d5906269-5d3c-4689-9f96-99b8fb1aca02	96e87606-370a-421b-8dea-6249bd3e29ca	0d8c0456-172e-4007-92eb-7965c7571a94	Snack Bong Ngo My	\N	19000	2	38000	\N
f4b26fa9-9acb-4eb9-88b4-75bad1d5919b	8b0dc122-554a-4ae1-947f-3fc399d8bb9b	6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	Mo Suong	\N	39000	1	39000	it da
26a48190-75db-4e3b-8bee-f133684ec6ca	8b0dc122-554a-4ae1-947f-3fc399d8bb9b	1d1c0124-29f5-4ded-b2ef-9787c984f06a	Hat Bi Hat Dua	\N	19000	2	38000	\N
ee632f1b-9117-498c-a433-1a3a2e81983a	8b0dc122-554a-4ae1-947f-3fc399d8bb9b	af247007-8aad-4e98-9fa8-d7f71822b787	Ca Phe Kem Sua Hanh Nhan	\N	39000	3	117000	\N
6e740fcb-ba95-4552-9a8c-5594eafbf65b	8b0dc122-554a-4ae1-947f-3fc399d8bb9b	e676c016-ead1-43be-9604-d6ab96a01c14	Queen Nu Hoang	\N	34000	1	34000	\N
631ed14c-c074-44bc-b64f-09072957d28a	c5f9b291-2ac2-4484-9e3e-727dbdeaf809	4c03576e-6b02-4ed8-9d33-bf143e2614ed	Bim Bim	\N	8000	2	16000	\N
7c2a5d1c-f7fb-442e-a8c9-a958a37b307d	9bd0b001-200d-4029-8d75-58f85e688250	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	3	117000	\N
e8e36143-a555-4333-a93d-820d7ae8067e	9bd0b001-200d-4029-8d75-58f85e688250	ef12c6e9-eaf2-40e9-b563-f942d2ee8084	Ca Phe Kem Muoi	\N	34000	1	34000	\N
10dcedaa-7c5d-4871-8555-4e731856b6f3	5679546f-c315-4c78-8939-139c10b3b820	4334294a-36f3-4de0-b6e7-2f7bee85dc82	Ca Phe Kem Sua Dua	\N	39000	1	39000	\N
97b5f37f-b0cc-4142-96bc-1b7a3be29a7b	5679546f-c315-4c78-8939-139c10b3b820	7842eb3d-d367-432b-a598-fbc626cfed25	Bau Troi Xanh	\N	48000	2	96000	\N
34f5f414-b1a8-4243-be25-173d95e367dc	5679546f-c315-4c78-8939-139c10b3b820	bb86f6d1-7657-4933-b1ac-8ea48dbde363	Tra Sua Chalo Nguyen Vi	\N	34000	3	102000	\N
dfb80679-2205-482a-99a9-23ec30ab080a	276b140e-27bf-4d38-aa07-519779d64564	12aae6fb-fc6d-455f-9902-3904a4d0722e	Ca Phe Sua Tuoi Caramel	\N	34000	2	68000	\N
ab2a788d-2ee9-4f9f-8fb5-4a308b7d0c7b	276b140e-27bf-4d38-aa07-519779d64564	b4a42867-66b4-4a0a-bee1-149fbe066e67	Matcha Latte	\N	39000	3	117000	\N
0af1606b-db82-4eec-a91a-94110033f9f1	276b140e-27bf-4d38-aa07-519779d64564	d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	Tra Dao Ton Ngo Khong	\N	48000	1	48000	\N
02053ca1-d7e6-4625-8aa0-8a3b7c9cf93f	276b140e-27bf-4d38-aa07-519779d64564	3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	Sinh To Sau Rieng	\N	69000	2	138000	\N
a2f26217-c1c7-485c-9666-3567ee94bc24	0cc41b4e-b50f-46d7-b380-045da829cfd9	3a74275b-1d45-446f-8dfb-b0fb26b06bde	Hoa Vang Tren Co Xanh	\N	48000	3	144000	\N
a535d74c-ca7f-4ba3-964d-924f40c93589	701d31ee-1eb8-457d-8acb-c18cf97f054a	03adf784-c4c7-4adc-b126-3b0e89df4088	Tra Sua Chalo Mix Vi	\N	39000	1	39000	\N
57ffc530-d49c-45a5-82c4-3c89574db93d	701d31ee-1eb8-457d-8acb-c18cf97f054a	32225b18-cd42-4ce0-95bc-5c15353c89e9	Hang Nga	\N	48000	2	96000	\N
3f51478a-1777-44e3-8f38-a6546e8f5802	5759b194-5e3f-4205-ae9f-5cdf25beb086	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
d08209f1-fe77-41bf-992c-d99146ee5349	5c941b65-aff4-4e8c-b423-a4108b64dcaf	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
a4a98b45-c706-4546-93a2-1de906a59a7c	d83e9ace-7d1b-4bd4-83b2-482914acbba7	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
f13ff551-18e3-42d8-8790-1a0bdc36d512	15adfb8d-c2e8-4b93-a193-e0ac14d16023	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
0f2d2be6-3a88-4dc1-a446-814acd44a619	bcf6d649-bfa2-4d32-b722-f61706b781e1	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
642a494c-b027-4bd1-a351-608f4f8e061e	8761ae61-e5cb-44c1-97a0-701ed2990d65	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
8a361ac5-ee69-482f-9e91-e0bfcc1b865e	61394c6e-87b7-4fda-b2df-6a28ab095401	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
1a699cde-f76b-42a4-b6c1-6aba4c9b3ff6	ed049976-9c3c-4b37-8853-2c12b6fc9ddb	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
8ae34721-c226-412c-b65b-6d1dba6dbd8c	5b930741-c3b3-4c2d-98dc-d61a94d06bf0	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
6837ec4f-2cdb-49ef-af48-eb701aa3d8e8	39554379-a87a-43bf-8e80-91c7fa5be89f	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
8749d182-51bb-40e3-931b-1bfce94f685d	50614198-1ede-41d4-8dff-32d11f2ef472	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
7ef3efed-3c2a-4b40-80a4-232740cda83e	016cec69-8553-4609-a5e8-2c0edb2dc073	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
eb4ea098-a6ea-4cbf-a586-a3e9e91733b1	f3536ff2-18fc-48d9-b7be-8a3e6e248fbf	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
996c0741-794c-413b-b98e-f996a7907e44	9c3fdd21-3faa-4f6b-b113-3493bfee3d61	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
3caee05d-4c4d-416a-8b08-88939c424cb2	8961a5a0-1129-4a70-8c38-091cddf147b0	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
deb6b475-3f1a-4902-8e1d-34cbf5edc031	1e120cf9-6388-48a3-ba9e-23be93b8c716	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
f82cd5e2-b4c9-4949-8b65-17c2ef5a1420	a3d9f414-15b5-4d7a-adb0-b96fe01f6306	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
9952ee3f-79d2-45d8-8468-6c3f9424cd24	501a83c3-09dc-4fc8-81b0-52fa43c9c947	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
b0facf3a-8ec1-4071-84ae-cf406e1a958f	6ffeb4d9-c11a-4145-9e9c-b21b19528343	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
86a9cb3d-1c9e-4d37-b5e0-b35971203b47	983511e4-f27a-4be0-a300-9aa95bf62cc0	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
6265f21b-323c-4076-8567-b050dc3e1be9	6cf0576e-38a4-4000-b3b2-fa36e41395dc	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
25c12254-a7c8-4689-adab-42ed55403c79	6c076d47-0815-4323-b1da-1f3ac6da9c39	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
bf66f489-a541-4c1e-ac41-8185c8d95643	7bc70f63-16b8-4803-9492-7e75215bbf9c	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
ee29b822-3512-48d9-b08b-f0be93ffe773	94cebf0b-d35c-44d9-b2e3-8ecffc35d91d	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
2c3c373a-9ef7-48cc-b2dd-be1cc3e1e09e	6a783f69-65c8-4c9c-80eb-23a1445af8d5	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
511e0c3e-d9b0-44bf-998d-40152cc2073c	e2acb6c5-0fb4-4689-b841-fe13597e12be	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
f454bcd5-375a-45c0-af97-0431b7bfb905	8a6c1b35-a3ef-4b41-b7b1-43d17901d308	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
ba8dad2d-48e0-4f2b-8bb6-f678ba653c1c	f26e16b1-16af-4471-9163-f91dd447c208	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
c6736a32-9ca6-4c15-b87a-048ca03279fb	d1bd919b-4a4b-415e-8b1a-215abe962371	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
0dd5ac5f-8528-4ab6-96f0-42f0fe6cda25	19f1f310-a22a-4d2d-b0df-12955fa4c719	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
0caa71a4-506a-4dfc-ba8a-70763ddc83db	824f72fa-48c4-481d-ae30-0f00062e6f9c	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
15d88d1f-05ce-4a8c-b417-796ed409e0e1	9a6f0dc0-042d-4e53-b4eb-eae964801170	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
7558b1a5-c998-4f40-9c23-238294b449a3	5b6baed5-a8a5-4678-ab64-df4ddc92bcae	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
ee817661-1dff-4e50-b22f-86337d2686c6	08b631c7-29e7-449e-845e-8030363a1e79	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
8381caa8-32e7-4149-a8cd-c3a0e105183d	7ae950c9-3a4f-4649-bb2c-5186ae0609d5	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
c92ede48-3c3b-4379-a6f4-145e3b8c87cf	72439bcc-cf6e-4efb-82b8-c9906e68ceaf	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
66829557-dcb7-4a97-a508-80202e4d7c29	67e818fa-72c6-430f-a692-f75af577cc66	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
d4b7b639-0f18-4748-8fad-07b656c75a3a	4dcdcde6-a44e-423b-9c45-78787140ad00	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
33520aba-859e-4e06-b8c7-e8719b958afa	3cd3229c-72f1-4a56-9508-acdf23e7b4c6	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
2c0f7ae5-2f07-437d-acf6-a2a8aca302db	45f3c17c-6b8b-42bd-bec0-90128edfb513	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
3b3ed6b1-49c2-45da-8dce-b946a77aa134	21ded0ac-c612-46b2-9181-f368680c7a4e	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
4d9336c8-6af5-4ea9-ba06-04f85bf1b9eb	1c85d1a8-fe85-48da-b76a-9d6b6292de40	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
d6f7fae3-26f7-4666-ad54-beede56dbad2	d522daf0-e9d1-4a76-b279-8c418e6e20c2	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
e064746e-a73c-4e79-973e-3655299ec6f6	4b23a795-0ea5-432e-9935-107a8f104b91	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
feb708e7-0cff-47ca-841f-6d6c240eb8f3	a923cf7f-c581-4a1a-9b57-44612da5dd65	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
b19acf9a-d223-4f57-b34f-ef56934983b8	1b626057-e6aa-4ae1-a26f-8ca5a8c2763e	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
fc0783ab-8868-4333-a482-20ed5de76a35	824ad34e-aff8-4a61-b960-2ec0748eb4ba	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
93e95909-5a70-423b-b668-288ddfc30310	f60b9d90-89a3-4b2d-aeeb-8bc318129d83	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
4c1a57ae-b8f3-4148-8f2b-07c2414ffcda	1751d5e5-0ed9-41b1-ba87-42a02ec0ba10	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
589a44dc-1949-4a35-9795-89318e11c127	697494b8-d981-41d3-9236-b971d44a13a7	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
b2e7d9b0-601a-4e00-af9d-8ad6f9dfb6e5	27cf524b-7b4e-4687-9425-c921939b97c2	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
b834d12a-d1b3-41d1-baf1-7c27ca12df93	678c6c1f-68c1-49d8-b892-9684ead0a311	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
4b684a81-d08a-4410-b6cd-c2f6fe9c8859	235d10bb-37ac-4b6f-beed-9195d3dc2f2c	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
057c0449-a870-4477-a08f-727606677de8	5776a0f0-2a19-4e96-a5a2-6c292f4ac2ef	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
3ad9d18f-09b1-4fb2-a499-04e441492196	ba78d78a-05a1-4f9c-993b-a3a4af6daad8	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
dccded64-5293-4123-ba5f-17c9ea212256	dcadb73f-feca-4d13-9c33-72225db74c8c	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
304729bc-6d6d-4f3e-8cf1-1afc327fa325	fb4926ec-a1ba-4574-b6af-7a080b470921	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
48d38fde-be6e-4fe1-9705-71d5a8246ed4	42ce67d4-f9d4-4e47-b19f-16cbca276bdb	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
ff2c2207-b707-4795-a71b-47a8891115db	b2ccc084-07f8-4619-a146-0b8d3c9a2d46	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
6b0e3594-09f7-48cd-bf56-977c9b50fa1c	91eb5f51-dcf4-418d-b648-0429c0fe9126	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
19908ed1-bb25-41d1-becc-6a495685c703	001addf0-36f8-4e7b-929b-1d40d5b26696	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
d4a47be6-ff7c-4166-a3e3-59efd48f5294	dc4ce071-6923-4dc6-804e-b33eb3a38ca1	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	1	39000	\N
27f4d6f1-fd92-4b95-aed6-f48a828c7018	a835cfb2-44b5-4204-9126-8c56e67bd84e	abc7671f-64fc-479b-8425-269a99337fc9	Cold Drip	\N	39000	2	78000	\N
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, "tableId", "tableToken", status, "paidStatus", "totalAmount", "estimatedWaitMinutes", note, "paymentRequested", "createdAt", "updatedAt", "pagerId") FROM stdin;
b2ccc084-07f8-4619-a146-0b8d3c9a2d46	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	PENDING	t	78000	0	\N	f	2026-07-16 16:39:57.919512	2026-07-16 16:40:00.462641	\N
b319fa81-059b-4829-aa97-d9c2c124a665	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	CANCELLED	f	174000	7	\N	f	2026-07-05 16:29:02.01927	2026-07-05 16:29:02.01927	\N
001addf0-36f8-4e7b-929b-1d40d5b26696	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	f	39000	0	\N	f	2026-07-16 16:40:01.512435	2026-07-16 16:40:01.512435	\N
91eb5f51-dcf4-418d-b648-0429c0fe9126	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	t	78000	0	\N	f	2026-07-16 16:40:01.375583	2026-07-16 16:40:01.620112	\N
fbbaf8c7-cdd0-42cd-bdaa-64b51352b654	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	CANCELLED	f	402000	13	\N	f	2026-07-05 16:29:02.056687	2026-07-05 16:29:02.056687	\N
72439bcc-cf6e-4efb-82b8-c9906e68ceaf	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	f	39000	432	\N	f	2026-07-16 14:39:57.431885	2026-07-16 14:39:57.431885	\N
7117aa81-a396-497f-8b4a-1544ae5bcd53	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	CANCELLED	f	201000	7	\N	f	2026-07-05 16:29:02.095126	2026-07-05 16:29:02.095126	\N
8d8bbf6d-6df2-4259-8179-043aadca636d	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	CANCELLED	f	447000	13	\N	f	2026-07-05 16:29:02.135677	2026-07-05 16:29:02.135677	\N
1b3aa80f-c1c0-43e1-9fb8-c0f192861b43	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	CANCELLED	f	96000	7	\N	f	2026-07-05 16:29:02.176014	2026-07-05 16:29:02.176014	\N
cb1e0c46-8e56-4d3b-ac6a-e562e9647533	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	CANCELLED	f	417000	13	\N	f	2026-07-05 16:29:02.216071	2026-07-05 16:29:02.216071	\N
7ae950c9-3a4f-4649-bb2c-5186ae0609d5	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	t	78000	432	\N	f	2026-07-16 14:39:57.276674	2026-07-16 14:39:57.623755	\N
03e2737b-64ca-4719-860c-af87e69e8227	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	CANCELLED	f	156000	7	\N	f	2026-07-05 16:29:02.255384	2026-07-05 16:29:02.255384	\N
cd846df3-b773-4bcc-8927-93c63167aece	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	CANCELLED	f	316000	13	\N	f	2026-07-05 16:29:02.295141	2026-07-05 16:29:02.295141	\N
67e818fa-72c6-430f-a692-f75af577cc66	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	39000	\N	E2E_PAGER_THROWAWAY	f	2026-07-16 14:40:01.145421	2026-07-16 14:40:07.126342	\N
fe737737-fae0-4721-8af0-650ea3324534	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	CANCELLED	f	165000	7	\N	f	2026-07-05 16:29:02.339223	2026-07-05 16:29:02.339223	\N
1751d5e5-0ed9-41b1-ba87-42a02ec0ba10	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	PENDING	t	78000	432	\N	f	2026-07-16 15:34:48.949391	2026-07-16 15:34:51.992953	\N
27cf524b-7b4e-4687-9425-c921939b97c2	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	f	39000	432	\N	f	2026-07-16 15:34:53.410213	2026-07-16 15:34:53.410213	\N
697494b8-d981-41d3-9236-b971d44a13a7	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	t	78000	432	\N	f	2026-07-16 15:34:53.285531	2026-07-16 15:34:53.609302	\N
65838b50-e04a-4b3b-a297-a4ef47a46eac	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	f	222000	3	\N	f	2026-07-05 16:29:01.989291	2026-07-05 16:29:01.989291	\N
51af2375-a636-46b7-8ac3-04bd850f1657	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	CANCELLED	f	237000	4	\N	f	2026-07-05 16:29:01.995316	2026-07-05 16:29:01.995316	\N
61394c6e-87b7-4fda-b2df-6a28ab095401	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-05 17:38:29.543155	2026-07-05 17:38:32.610456	\N
c85b4dda-ecec-4b35-8480-e28b2bd4971a	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	CANCELLED	f	175000	8	\N	f	2026-07-05 16:29:02.026118	2026-07-05 16:29:02.026118	\N
1c1c7b7c-1d34-44dd-bacd-7c20b59fc087	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	CANCELLED	f	320000	9	\N	f	2026-07-05 16:29:02.031974	2026-07-05 16:29:02.031974	\N
e975fec2-a659-4548-a864-c16eaa790af0	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	CANCELLED	f	369000	13	\N	f	2026-07-05 16:29:02.3773	2026-07-05 16:29:02.3773	\N
dc4ce071-6923-4dc6-804e-b33eb3a38ca1	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	39000	\N	E2E_PAGER_THROWAWAY	f	2026-07-16 16:40:05.399408	2026-07-16 16:40:10.8686	\N
448853fe-46cd-437b-a4ec-09fce67630b2	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	CANCELLED	f	255000	7	\N	f	2026-07-05 16:29:02.415733	2026-07-05 16:29:02.415733	\N
a835cfb2-44b5-4204-9126-8c56e67bd84e	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	78000	\N	E2E_RECEIPT_THROWAWAY	f	2026-07-16 16:40:05.635889	2026-07-16 16:40:11.250855	\N
07814485-ca67-478c-976f-6487c5cecdf4	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	CANCELLED	f	391000	13	\N	f	2026-07-05 16:29:02.450168	2026-07-05 16:29:02.450168	\N
8a6c1b35-a3ef-4b41-b7b1-43d17901d308	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	PENDING	t	78000	432	\N	f	2026-07-16 14:37:30.491706	2026-07-16 14:37:35.721456	\N
22814d37-f455-4473-95b8-b33f5e4c17a6	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	CANCELLED	f	156000	7	\N	f	2026-07-05 16:29:02.489182	2026-07-05 16:29:02.489182	\N
3cd3229c-72f1-4a56-9508-acdf23e7b4c6	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	PENDING	t	78000	432	\N	f	2026-07-16 15:29:43.400386	2026-07-16 15:29:46.515318	\N
e3800ad9-59af-4a01-bbad-e9cd16a66c3b	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	CANCELLED	f	292000	13	\N	f	2026-07-05 16:29:02.526444	2026-07-05 16:29:02.526444	\N
3ebe5151-c98c-4166-9d44-8b438e742256	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	CANCELLED	f	151000	7	\N	f	2026-07-05 16:29:02.561078	2026-07-05 16:29:02.561078	\N
678c6c1f-68c1-49d8-b892-9684ead0a311	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	39000	432	E2E_PAGER_THROWAWAY	f	2026-07-16 15:34:57.933515	2026-07-16 15:35:02.089353	\N
dd1b4022-399a-437f-bbe7-a729fa97c20f	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	CANCELLED	f	117000	10	\N	t	2026-07-05 16:29:02.038048	2026-07-05 16:29:02.038048	\N
a1b165ff-86f1-4163-9b68-0029dadfd2b3	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	CANCELLED	f	326000	13	\N	f	2026-07-05 16:29:02.60214	2026-07-05 16:29:02.60214	\N
19af9944-d66c-4d55-8eec-7401c0f962d5	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	CANCELLED	f	34000	2	don test	f	2026-07-05 16:29:02.064916	2026-07-05 16:29:02.064916	\N
0c5f4a38-106e-4540-975a-ac0afc339968	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	CANCELLED	f	225000	3	\N	f	2026-07-05 16:29:02.072656	2026-07-05 16:29:02.072656	\N
92a9d5ef-7aec-4348-8bd0-cc81058b0844	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	f	183000	7	\N	f	2026-07-05 16:29:02.641456	2026-07-05 16:29:02.641456	\N
4312b4ac-0bdf-4163-bfce-4f6934b8bf5a	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	CANCELLED	f	271000	4	\N	f	2026-07-05 16:29:02.07889	2026-07-05 16:29:02.07889	\N
6517e24a-c096-4561-8e36-b87e9a3dfc25	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	CANCELLED	f	209000	8	\N	f	2026-07-05 16:29:02.100868	2026-07-05 16:29:02.100868	\N
21b57388-ce20-4829-8cea-5bee24351243	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	CANCELLED	f	259000	13	\N	f	2026-07-05 16:29:02.679467	2026-07-05 16:29:02.679467	\N
58b750eb-c87a-4ab9-89aa-6e56f2a3599b	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	CANCELLED	f	285000	9	\N	f	2026-07-05 16:29:02.107132	2026-07-05 16:29:02.107132	\N
dffe016c-19b2-4ca5-82f5-2ed2a41868c3	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	CANCELLED	f	117000	10	\N	t	2026-07-05 16:29:02.113662	2026-07-05 16:29:02.113662	\N
501a83c3-09dc-4fc8-81b0-52fa43c9c947	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-07 12:09:01.434747	2026-07-07 12:09:01.621192	\N
5418e600-da7d-4227-a433-6d006c8edac1	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	CANCELLED	f	39000	2	don test	f	2026-07-05 16:29:02.142941	2026-07-05 16:29:02.142941	\N
c646ab28-b848-476c-beff-f9249d6ed425	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	CANCELLED	f	340000	9	\N	f	2026-07-05 16:29:02.35079	2026-07-05 16:29:02.35079	\N
c0b0a6a6-8c87-4a99-8e50-db78355b1f05	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	CANCELLED	f	144000	10	\N	t	2026-07-05 16:29:02.35618	2026-07-05 16:29:02.35618	\N
ed049976-9c3c-4b37-8853-2c12b6fc9ddb	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-05 19:05:49.092077	2026-07-05 19:05:54.429412	\N
7a95fb1e-fd32-42af-9137-7438d7cd54df	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	CANCELLED	f	183000	7	\N	f	2026-07-05 16:29:02.714083	2026-07-05 16:29:02.714083	\N
05867d47-08b5-4b7c-9b42-6cf81267d55d	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	CANCELLED	f	402000	13	\N	f	2026-07-05 16:29:02.750384	2026-07-05 16:29:02.750384	\N
e7abd5f1-6921-4d5f-aa0a-e1606a5c4b5c	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	152000	7	\N	f	2026-07-05 16:29:02.785648	2026-07-05 16:29:02.785648	\N
f26e16b1-16af-4471-9163-f91dd447c208	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	f	78000	\N	\N	f	2026-07-16 14:37:38.10223	2026-07-16 14:37:38.10223	\N
a51d2ddb-07a1-4cec-9afc-2403bf25b617	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	CANCELLED	f	384000	13	\N	f	2026-07-05 16:29:02.821975	2026-07-05 16:29:02.821975	\N
d1bd919b-4a4b-415e-8b1a-215abe962371	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	f	39000	\N	\N	f	2026-07-16 14:37:38.220122	2026-07-16 14:37:38.220122	\N
d597665d-0b96-43b2-b8a4-626efa31dd88	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	CANCELLED	f	101000	7	\N	f	2026-07-05 16:29:02.85499	2026-07-05 16:29:02.85499	\N
25d587fb-6eec-4d00-83ca-e12b885ac741	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	CANCELLED	f	393000	13	\N	f	2026-07-05 16:29:02.895259	2026-07-05 16:29:02.895259	\N
19f1f310-a22a-4d2d-b0df-12955fa4c719	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	78000	432	E2E_RECEIPT_THROWAWAY	f	2026-07-16 14:37:40.352373	2026-07-16 14:37:50.857371	\N
6fec7006-04df-4613-b59a-88b7fd9f939c	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	CANCELLED	f	141000	7	\N	f	2026-07-05 16:29:02.928353	2026-07-05 16:29:02.928353	\N
45f3c17c-6b8b-42bd-bec0-90128edfb513	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	t	78000	432	\N	f	2026-07-16 15:29:47.553413	2026-07-16 15:29:48.511111	\N
9a627eef-e59f-4ceb-b591-c1d4fb6ca037	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	CANCELLED	f	358000	13	\N	f	2026-07-05 16:29:02.977391	2026-07-05 16:29:02.977391	\N
235d10bb-37ac-4b6f-beed-9195d3dc2f2c	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	78000	432	E2E_RECEIPT_THROWAWAY	f	2026-07-16 15:34:58.102025	2026-07-16 15:35:03.353705	\N
e137773f-3bee-4f1a-9de7-55c778ca0581	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	CANCELLED	f	175000	7	\N	f	2026-07-05 16:29:03.020407	2026-07-05 16:29:03.020407	\N
29d38982-e17f-4221-a657-1c7e0d15e747	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	f	194000	4	\N	f	2026-07-05 16:29:02.154004	2026-07-05 16:29:02.154004	\N
e2acb6c5-0fb4-4689-b841-fe13597e12be	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	f	39000	432	\N	f	2026-07-07 12:19:35.175664	2026-07-07 12:19:35.175664	\N
11250c11-547c-4b4f-8474-e7673c682988	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	CANCELLED	f	214000	8	\N	f	2026-07-05 16:29:02.182951	2026-07-05 16:29:02.182951	\N
9914a6e5-ba1c-4483-8efc-a7b3589c744e	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	CANCELLED	f	357000	9	\N	f	2026-07-05 16:29:02.189235	2026-07-05 16:29:02.189235	\N
4ff5edff-7209-437f-951d-7fe9a6a0bca4	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	CANCELLED	f	144000	10	\N	t	2026-07-05 16:29:02.195172	2026-07-05 16:29:02.195172	\N
ec804db0-68bd-4a51-8139-a637605c04cb	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	CANCELLED	f	240000	4	\N	f	2026-07-05 16:29:02.695474	2026-07-05 16:29:02.695474	\N
5b930741-c3b3-4c2d-98dc-d61a94d06bf0	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-05 19:10:20.53319	2026-07-05 19:10:22.017075	\N
6f433206-c24a-4b0e-9357-8abe4604a04f	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	CANCELLED	f	210000	8	\N	f	2026-07-05 16:29:02.72049	2026-07-05 16:29:02.72049	\N
4d36b689-fee0-4eaf-9dd1-6d4964709d38	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	CANCELLED	f	342000	9	\N	f	2026-07-05 16:29:02.726131	2026-07-05 16:29:02.726131	\N
b86df68d-9472-4e47-a223-5170b34917bb	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	CANCELLED	f	376000	13	\N	f	2026-07-05 16:29:03.053997	2026-07-05 16:29:03.053997	\N
5776a0f0-2a19-4e96-a5a2-6c292f4ac2ef	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	PREPARING	t	78000	432	\N	f	2026-07-16 16:13:32.089922	2026-07-16 16:43:09.120291	\N
60df636e-8775-468f-a1dd-2d3863df1e19	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	CANCELLED	f	156000	7	\N	f	2026-07-05 16:29:03.092645	2026-07-05 16:29:03.092645	\N
3ce095d5-e970-4d35-a317-3faae1c865f9	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	CANCELLED	f	396000	13	\N	f	2026-07-05 16:29:03.12341	2026-07-05 16:29:03.12341	\N
2d49538f-ee34-4b0b-a459-0fe3c722b42e	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	CANCELLED	f	156000	7	\N	f	2026-07-05 16:29:03.160374	2026-07-05 16:29:03.160374	\N
df4ebe13-2078-4d6b-9ce0-68eeb783b167	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	CANCELLED	f	354000	13	\N	f	2026-07-05 16:29:03.196028	2026-07-05 16:29:03.196028	\N
2397b108-90ed-4203-82d3-24f28e3265b8	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	CANCELLED	f	165000	7	\N	f	2026-07-05 16:29:03.235602	2026-07-05 16:29:03.235602	\N
824f72fa-48c4-481d-ae30-0f00062e6f9c	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	39000	432	E2E_PAGER_THROWAWAY	f	2026-07-16 14:37:42.586135	2026-07-16 14:37:49.671178	\N
21ded0ac-c612-46b2-9181-f368680c7a4e	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	f	39000	432	\N	f	2026-07-16 15:29:48.171404	2026-07-16 15:29:48.171404	\N
d56300b7-c443-4c06-b63d-75abd3d0102b	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	CANCELLED	f	363000	13	\N	f	2026-07-05 16:29:03.270327	2026-07-05 16:29:03.270327	\N
cae16fd7-0499-4147-9ab8-9afb478f61b7	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	CANCELLED	f	201000	7	\N	f	2026-07-05 16:29:03.305906	2026-07-05 16:29:03.305906	\N
1c85d1a8-fe85-48da-b76a-9d6b6292de40	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	39000	432	E2E_PAGER_THROWAWAY	f	2026-07-16 15:29:53.724988	2026-07-16 15:29:58.927219	\N
ae5c61fd-1454-4be4-9569-7163c7ca9aad	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	CANCELLED	f	308000	13	\N	f	2026-07-05 16:29:03.344336	2026-07-05 16:29:03.344336	\N
dcadb73f-feca-4d13-9c33-72225db74c8c	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	f	39000	432	\N	f	2026-07-16 16:13:35.673595	2026-07-16 16:13:35.673595	\N
ba78d78a-05a1-4f9c-993b-a3a4af6daad8	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	t	78000	432	\N	f	2026-07-16 16:13:35.548138	2026-07-16 16:13:35.879156	\N
6a783f69-65c8-4c9c-80eb-23a1445af8d5	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	t	78000	432	\N	f	2026-07-07 12:19:35.082346	2026-07-07 12:19:35.287848	\N
08ca1dd3-e6e2-42f4-9d15-d931a77a97bd	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	CANCELLED	f	39000	2	don test	f	2026-07-05 16:29:02.22455	2026-07-05 16:29:02.22455	\N
dc057591-22ed-4cc2-bac2-062dd25aace9	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	CANCELLED	f	141000	3	\N	f	2026-07-05 16:29:02.23113	2026-07-05 16:29:02.23113	\N
28f3881a-aca8-4c72-b33c-ea5dee9d7394	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	CANCELLED	f	234000	4	\N	f	2026-07-05 16:29:02.23794	2026-07-05 16:29:02.23794	\N
d9c8bf33-fb64-4b72-ae87-fd4680fd588c	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	CANCELLED	f	300000	8	\N	f	2026-07-05 16:29:02.26138	2026-07-05 16:29:02.26138	\N
39554379-a87a-43bf-8e80-91c7fa5be89f	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-05 19:12:43.761132	2026-07-05 19:12:44.317907	\N
ad4f97f1-9212-4dd5-bdd2-13c8ced41a67	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	CANCELLED	f	34000	2	don test	f	2026-07-05 16:29:03.060941	2026-07-05 16:29:03.060941	\N
3a4e6677-308c-4c1f-a87b-9b693620a5a7	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	CANCELLED	f	183000	7	\N	f	2026-07-05 16:29:03.382891	2026-07-05 16:29:03.382891	\N
1f4023d8-fce5-4bf9-a41d-096418a87a14	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	CANCELLED	f	387000	13	\N	f	2026-07-05 16:29:03.414853	2026-07-05 16:29:03.414853	\N
e4d8b827-770e-406a-a3b1-1c1e411a4607	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	CANCELLED	f	159000	7	\N	f	2026-07-05 16:29:03.449663	2026-07-05 16:29:03.449663	\N
941031da-369c-4d90-9d12-c1e32d8f7eea	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	CANCELLED	f	345000	13	\N	f	2026-07-05 16:29:03.485087	2026-07-05 16:29:03.485087	\N
9bd0b001-200d-4029-8d75-58f85e688250	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	CANCELLED	f	151000	7	\N	f	2026-07-05 16:29:03.516962	2026-07-05 16:29:03.516962	\N
5b6baed5-a8a5-4678-ab64-df4ddc92bcae	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	f	39000	432	\N	f	2026-07-16 14:39:11.996466	2026-07-16 14:39:11.996466	\N
22aa16d9-33ff-4244-87e2-8c0737e3ffcb	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	COMPLETED	t	78000	6	\N	t	2026-06-25 16:52:00.012437	2026-07-05 16:29:02.011013	\N
39cd1d73-920e-4a57-a604-d4779c4dac8c	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	COMPLETED	t	243000	12	\N	f	2026-07-02 16:52:00.012437	2026-07-05 16:29:02.049652	\N
9117a9b5-15b0-43eb-837f-871f419f7899	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	COMPLETED	t	138000	6	\N	t	2026-07-04 16:52:00.012437	2026-07-05 16:29:02.089734	\N
56f968f9-2956-4bf3-bb72-35d8480e59b9	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	COMPLETED	t	246000	12	\N	f	2026-06-24 16:52:00.012437	2026-07-05 16:29:02.128312	\N
73ac4bcb-1cb2-4db6-bfc5-c32ca9d04792	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	COMPLETED	t	78000	6	\N	t	2026-06-28 16:52:00.012437	2026-07-05 16:29:02.168851	\N
6ff4b6c1-3ecd-4ffb-a09b-8bd51590d5a7	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	COMPLETED	t	291000	12	\N	f	2026-06-30 16:52:00.012437	2026-07-05 16:29:02.206548	\N
673748a6-68ee-4be4-9fa6-539f9d1d8b22	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	COMPLETED	t	78000	6	\N	t	2026-07-01 16:52:00.012437	2026-07-05 16:29:02.249128	\N
47aff4c1-fb63-41e4-a1ef-80f205a527ee	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	COMPLETED	t	214000	12	\N	f	2026-06-28 16:52:00.012437	2026-07-05 16:29:02.288929	\N
39b49542-ebea-4039-b6de-dc96e1748c59	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	COMPLETED	t	96000	6	\N	t	2026-07-03 16:52:00.012437	2026-07-05 16:29:02.333747	\N
21c38fbf-3f11-4d57-9c08-1acb102759cf	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	COMPLETED	t	151000	12	\N	f	2026-06-26 16:52:00.012437	2026-07-05 16:29:02.370776	\N
0baaccc1-a3d0-470e-bc47-b9680908d840	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	COMPLETED	t	96000	6	\N	t	2026-07-01 16:52:00.012437	2026-07-05 16:29:02.408904	\N
e6d314b1-d4e8-480f-a14b-34c75eb0f1e0	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	COMPLETED	t	251000	12	\N	f	2026-06-29 16:52:00.012437	2026-07-05 16:29:02.44545	\N
9a6f0dc0-042d-4e53-b4eb-eae964801170	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	t	78000	432	\N	f	2026-07-16 14:39:11.952711	2026-07-16 14:39:12.028977	\N
d522daf0-e9d1-4a76-b279-8c418e6e20c2	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	78000	432	E2E_RECEIPT_THROWAWAY	f	2026-07-16 15:29:53.859362	2026-07-16 15:30:00.547867	\N
fb4926ec-a1ba-4574-b6af-7a080b470921	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	39000	\N	E2E_PAGER_THROWAWAY	f	2026-07-16 16:13:40.966626	2026-07-16 16:13:46.027811	\N
dd854fc7-889f-4d5e-81d5-1df8669d9fe0	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	CANCELLED	f	329000	9	\N	f	2026-07-05 16:29:02.268238	2026-07-05 16:29:02.268238	\N
d2ab4cf0-da12-47d6-b441-89ae7e050d12	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	COMPLETED	t	96000	6	\N	t	2026-06-24 16:52:00.012437	2026-07-05 16:29:02.483883	\N
917519c6-f772-412c-94b1-11b3657b03a5	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	COMPLETED	t	270000	12	\N	f	2026-07-03 16:52:00.012437	2026-07-05 16:29:02.519304	\N
bd314256-cbb9-4e7c-bea7-4019dab22c2e	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	COMPLETED	t	38000	6	\N	t	2026-07-05 16:52:00.012437	2026-07-05 16:29:02.554573	\N
3fc345bf-8ba7-4af4-8e5a-0cde42bd085d	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	COMPLETED	t	297000	12	\N	f	2026-06-30 16:52:00.012437	2026-07-05 16:29:02.595712	\N
8f0a75d9-f509-4552-86d9-349e82591219	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	COMPLETED	t	68000	6	\N	t	2026-06-22 16:52:00.012437	2026-07-05 16:29:02.636465	\N
6531f4d0-de11-40aa-8092-490878da2096	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	COMPLETED	t	174000	12	\N	f	2026-07-02 16:52:00.012437	2026-07-05 16:29:02.674346	\N
2f95ce1b-4d49-4590-bd4b-214f9c529844	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	COMPLETED	t	78000	6	\N	t	2026-07-05 16:52:00.012437	2026-07-05 16:29:02.707582	\N
e608075d-db24-4c68-9e1c-a0c74522a728	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	COMPLETED	t	234000	12	\N	f	2026-07-01 16:52:00.012437	2026-07-05 16:29:02.743695	\N
9fc8d012-1a7c-4fcc-a12d-e88c84a7fffb	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	COMPLETED	t	78000	6	\N	t	2026-06-29 16:52:00.012437	2026-07-05 16:29:02.780884	\N
a38fcc17-1238-45a9-8422-a7413616ef3d	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	COMPLETED	t	261000	12	\N	f	2026-06-27 16:52:00.012437	2026-07-05 16:29:02.816739	\N
eecb1872-7fba-4b1a-922e-4ca09f849fc9	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	COMPLETED	t	78000	6	\N	t	2026-06-26 16:52:00.012437	2026-07-05 16:29:02.848902	\N
a249e699-7f1c-4f4e-b327-9b14aa091005	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	COMPLETED	t	351000	12	\N	f	2026-06-28 16:52:00.012437	2026-07-05 16:29:02.887632	\N
f3729edf-6bdb-40dc-b4bf-3b1c77b11316	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	COMPLETED	t	78000	6	\N	t	2026-06-24 16:52:00.012437	2026-07-05 16:29:02.923905	\N
790cb840-338f-4a18-9cb8-5efca019dad0	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	COMPLETED	t	252000	12	\N	f	2026-06-26 16:52:00.012437	2026-07-05 16:29:02.970689	\N
e88c02c9-729e-45aa-bf56-a3d562783adb	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	COMPLETED	t	108000	6	\N	t	2026-06-28 16:52:00.012437	2026-07-05 16:29:03.012929	\N
ca2ec2e6-c627-4408-ba87-27337e1453c1	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	COMPLETED	t	189000	12	\N	f	2026-06-27 16:52:00.012437	2026-07-05 16:29:03.048228	\N
5f1d4e27-bf17-4d5f-817a-9cc4805d0b88	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	COMPLETED	t	96000	6	\N	t	2026-07-04 16:52:00.012437	2026-07-05 16:29:03.086591	\N
18b3516e-fb21-4e77-9527-79b1e22d56fc	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	COMPLETED	t	261000	12	\N	f	2026-06-28 16:52:00.012437	2026-07-05 16:29:03.117702	\N
60878188-16fe-4181-a2ce-5f5a5bdeed49	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	COMPLETED	t	96000	6	\N	t	2026-07-03 16:52:00.012437	2026-07-05 16:29:03.155269	\N
d80b15ca-37bf-41b6-8af8-7c3e15b2dde1	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	COMPLETED	t	251000	12	\N	f	2026-06-23 16:52:00.012437	2026-07-05 16:29:03.191446	\N
5b033109-5b49-4d46-9f58-d6a110092d95	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	COMPLETED	t	78000	6	\N	t	2026-06-23 16:52:00.012437	2026-07-05 16:29:03.228012	\N
9ca5cfc1-acf0-4306-8dcc-b6e8c13f4b1d	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	COMPLETED	t	262000	12	\N	f	2026-07-01 16:52:00.012437	2026-07-05 16:29:03.264519	\N
cb6d5293-5a30-42b9-a3f7-528f10c95446	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	COMPLETED	t	68000	6	\N	t	2026-06-26 16:52:00.012437	2026-07-05 16:29:03.301144	\N
360ef10e-31d4-48ba-8722-688929a90c20	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	COMPLETED	t	179000	12	\N	f	2026-07-04 16:52:00.012437	2026-07-05 16:29:03.337422	\N
01e10756-c7b3-4536-bb3c-35643c3f4cf7	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	COMPLETED	t	78000	6	\N	t	2026-07-03 16:52:00.012437	2026-07-05 16:29:03.375815	\N
500fae9f-d986-479c-9045-d34336eb40e7	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	COMPLETED	t	199000	12	\N	f	2026-06-26 16:52:00.012437	2026-07-05 16:29:03.408936	\N
218316c3-4b6e-4ef3-ad73-83ab682c68f4	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	COMPLETED	t	78000	6	\N	t	2026-06-27 16:52:00.012437	2026-07-05 16:29:03.445099	\N
9d5ead4e-989c-4d5e-84ee-5d720335fde6	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	COMPLETED	t	271000	12	\N	f	2026-06-30 16:52:00.012437	2026-07-05 16:29:03.479875	\N
b6449b9d-e90b-46b9-ab6c-b88d32978315	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	CANCELLED	t	126000	11	\N	f	2026-06-22 16:52:00.012437	2026-07-05 16:29:02.512797	\N
c5f9b291-2ac2-4484-9e3e-727dbdeaf809	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	COMPLETED	t	16000	6	\N	t	2026-06-30 16:52:00.012437	2026-07-05 16:29:03.510925	\N
8b0dc122-554a-4ae1-947f-3fc399d8bb9b	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	CANCELLED	t	228000	5	\N	f	2026-06-23 16:52:00.012437	2026-07-05 16:29:03.505011	\N
50614198-1ede-41d4-8dff-32d11f2ef472	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	39000	432	\N	f	2026-07-05 20:03:02.655153	2026-07-05 22:51:48.432058	\N
08b631c7-29e7-449e-845e-8030363a1e79	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	PENDING	t	78000	432	\N	f	2026-07-16 14:39:52.676684	2026-07-16 14:39:55.958515	\N
4dcdcde6-a44e-423b-9c45-78787140ad00	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	78000	\N	E2E_RECEIPT_THROWAWAY	f	2026-07-16 14:40:01.494764	2026-07-16 14:40:09.443442	\N
4b23a795-0ea5-432e-9935-107a8f104b91	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	PENDING	t	78000	432	\N	f	2026-07-16 15:33:36.807192	2026-07-16 15:33:39.205793	\N
1b626057-e6aa-4ae1-a26f-8ca5a8c2763e	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	f	39000	432	\N	f	2026-07-16 15:33:40.006837	2026-07-16 15:33:40.006837	\N
a923cf7f-c581-4a1a-9b57-44612da5dd65	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	PENDING	t	78000	432	\N	f	2026-07-16 15:33:39.91177	2026-07-16 15:33:40.102931	\N
824ad34e-aff8-4a61-b960-2ec0748eb4ba	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	39000	\N	E2E_PAGER_THROWAWAY	f	2026-07-16 15:33:44.695372	2026-07-16 15:33:50.225426	\N
f60b9d90-89a3-4b2d-aeeb-8bc318129d83	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	78000	\N	E2E_RECEIPT_THROWAWAY	f	2026-07-16 15:33:44.920966	2026-07-16 15:33:51.527824	\N
42ce67d4-f9d4-4e47-b19f-16cbca276bdb	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	f	78000	\N	E2E_RECEIPT_THROWAWAY	f	2026-07-16 16:13:41.131907	2026-07-16 16:13:47.779385	\N
c2b38996-ee17-41d0-90b8-6034eb74077f	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	CANCELLED	f	144000	10	\N	t	2026-07-05 16:29:02.275637	2026-07-05 16:29:02.275637	\N
ba969e3c-c672-4242-b09e-be50da32c305	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	CANCELLED	f	8000	2	don test	f	2026-07-05 16:29:02.305997	2026-07-05 16:29:02.305997	\N
6d0e3064-cb14-4816-97c8-93b42f65cf04	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	CANCELLED	f	180000	3	\N	f	2026-07-05 16:29:02.311885	2026-07-05 16:29:02.311885	\N
d330a3a8-a500-4393-8987-1d31fc6fb468	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	CANCELLED	f	240000	8	\N	f	2026-07-05 16:29:02.343951	2026-07-05 16:29:02.343951	\N
ecb2be8a-e60b-4035-878a-995a019b47ec	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	39000	2	don test	f	2026-07-05 16:29:01.980574	2026-07-05 17:35:52.0026	\N
95b939d9-e39e-40c7-8d4d-9685d093555f	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	213000	3	\N	f	2026-07-05 16:29:02.148118	2026-07-05 17:35:52.0026	\N
4fef8dc2-972f-4cd8-ad61-8cfceeae9ec8	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	233000	4	\N	f	2026-07-05 16:29:02.319304	2026-07-05 17:35:52.0026	\N
fd0c536d-22f9-4fbb-8a25-d7e2611b02fe	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	CANCELLED	f	44000	2	don test	f	2026-07-05 16:29:02.384306	2026-07-05 16:29:02.384306	\N
042c2a4f-e6f9-4e68-8f8e-29e932a02dd0	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	CANCELLED	f	212000	3	\N	f	2026-07-05 16:29:02.390004	2026-07-05 16:29:02.390004	\N
1c3c9fd3-a4ae-4809-b856-9eae0613551c	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	CANCELLED	f	311000	4	\N	f	2026-07-05 16:29:02.397517	2026-07-05 16:29:02.397517	\N
ddeaa13b-143a-410f-8efc-6aac49d5e35b	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	CANCELLED	f	249000	8	\N	f	2026-07-05 16:29:02.422189	2026-07-05 16:29:02.422189	\N
7617ed61-38f5-443c-bdf7-fe638c906210	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	CANCELLED	f	275000	9	\N	f	2026-07-05 16:29:02.429225	2026-07-05 16:29:02.429225	\N
aa545fcc-840d-48fc-980e-1ceb4fa0d822	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	CANCELLED	f	57000	10	\N	t	2026-07-05 16:29:02.435906	2026-07-05 16:29:02.435906	\N
6ffeb4d9-c11a-4145-9e9c-b21b19528343	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-07 12:09:01.474937	2026-07-07 12:09:37.649224	\N
f3ea119a-2f1a-4129-bce5-b618108e60eb	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	CANCELLED	f	39000	2	don test	f	2026-07-05 16:29:02.454885	2026-07-05 16:29:02.454885	\N
36e00d34-8be0-401c-b154-eeb228d478e7	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	CANCELLED	f	222000	3	\N	f	2026-07-05 16:29:02.461355	2026-07-05 16:29:02.461355	\N
02533b08-c249-4395-99fa-9626d71d0fa1	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	CANCELLED	f	261000	4	\N	f	2026-07-05 16:29:02.468233	2026-07-05 16:29:02.468233	\N
399eb380-bc41-4d99-aad7-4772b67f2828	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	CANCELLED	f	241000	8	\N	f	2026-07-05 16:29:02.495354	2026-07-05 16:29:02.495354	\N
701d31ee-1eb8-457d-8acb-c18cf97f054a	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	CANCELLED	t	135000	11	\N	f	2026-06-29 16:52:00.012437	2026-07-05 16:29:03.537908	\N
5759b194-5e3f-4205-ae9f-5cdf25beb086	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	39000	432	\N	f	2026-07-05 17:21:16.873084	2026-07-05 17:35:52.0026	\N
5c941b65-aff4-4e8c-b423-a4108b64dcaf	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-05 17:26:46.651783	2026-07-05 17:35:52.0026	\N
d83e9ace-7d1b-4bd4-83b2-482914acbba7	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-05 17:29:28.175428	2026-07-05 17:35:52.0026	\N
15adfb8d-c2e8-4b93-a193-e0ac14d16023	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-05 17:29:45.268564	2026-07-05 17:35:52.0026	\N
bcf6d649-bfa2-4d32-b722-f61706b781e1	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	39000	432	\N	f	2026-07-05 17:35:22.050767	2026-07-05 17:35:52.0026	\N
8761ae61-e5cb-44c1-97a0-701ed2990d65	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	39000	432	\N	f	2026-07-05 17:35:51.752549	2026-07-05 17:35:52.0026	\N
a3d9f414-15b5-4d7a-adb0-b96fe01f6306	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-07 12:05:59.342725	2026-07-07 12:06:00.138261	\N
94cebf0b-d35c-44d9-b2e3-8ecffc35d91d	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-07 12:19:34.949562	2026-07-07 12:19:38.738072	\N
3577f2f5-23ca-44a1-b106-7d1f8d329877	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	CANCELLED	f	295000	9	\N	f	2026-07-05 16:29:02.501131	2026-07-05 16:29:02.501131	\N
6d45cb84-dfc2-4a9e-9c03-d3b86c6330d9	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	CANCELLED	f	117000	10	\N	t	2026-07-05 16:29:02.506914	2026-07-05 16:29:02.506914	\N
aa244841-cd05-4bbf-8ab2-4aa783e73535	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	CANCELLED	f	58000	2	don test	f	2026-07-05 16:29:02.532745	2026-07-05 16:29:02.532745	\N
27725e9c-1ab5-442a-8d01-8dfa981839ed	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	CANCELLED	f	195000	3	\N	f	2026-07-05 16:29:02.537673	2026-07-05 16:29:02.537673	\N
c7ebecd4-5a36-4dcb-8606-bc53e4060549	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	CANCELLED	f	217000	4	\N	f	2026-07-05 16:29:02.542377	2026-07-05 16:29:02.542377	\N
43531c45-f37a-4224-8b96-8b560999c07c	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	CANCELLED	f	259000	8	\N	f	2026-07-05 16:29:02.568598	2026-07-05 16:29:02.568598	\N
a72a71ea-98eb-4136-9adc-1fb82cffc395	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	CANCELLED	f	367000	9	\N	f	2026-07-05 16:29:02.575916	2026-07-05 16:29:02.575916	\N
fafd21a5-ea19-4fda-b002-0accbb3af002	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	CANCELLED	f	102000	10	\N	t	2026-07-05 16:29:02.582583	2026-07-05 16:29:02.582583	\N
f9275d40-0b73-41e5-bea5-04e6f3068124	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	CANCELLED	f	39000	2	don test	f	2026-07-05 16:29:02.61003	2026-07-05 16:29:02.61003	\N
5d13a0fe-b05a-4eb8-a3b6-48ae16eb70f7	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	CANCELLED	f	133000	3	\N	f	2026-07-05 16:29:02.617429	2026-07-05 16:29:02.617429	\N
484fbd0d-e1de-43a8-9000-7649eda63866	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	CANCELLED	f	247000	4	\N	f	2026-07-05 16:29:02.62488	2026-07-05 16:29:02.62488	\N
169423f1-7580-4b9a-82cc-9ebf8d6a7591	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	CANCELLED	f	252000	8	\N	f	2026-07-05 16:29:02.647293	2026-07-05 16:29:02.647293	\N
10c82dec-1338-45cf-9b7f-eab5f3083027	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	CANCELLED	f	284000	9	\N	f	2026-07-05 16:29:02.653442	2026-07-05 16:29:02.653442	\N
73a99bd6-683d-4705-b95d-50689f446357	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	CANCELLED	f	165000	10	\N	t	2026-07-05 16:29:02.661512	2026-07-05 16:29:02.661512	\N
949f557f-d357-4a9e-81fb-13ce77a332ba	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	CANCELLED	f	39000	2	don test	f	2026-07-05 16:29:02.684737	2026-07-05 16:29:02.684737	\N
286a4356-4acd-4e60-8901-452dd6420d32	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	CANCELLED	f	232000	3	\N	f	2026-07-05 16:29:02.690426	2026-07-05 16:29:02.690426	\N
57c52e4d-1c9c-499f-974e-7f7223308522	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	CANCELLED	f	117000	10	\N	t	2026-07-05 16:29:02.731331	2026-07-05 16:29:02.731331	\N
016cec69-8553-4609-a5e8-2c0edb2dc073	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-05 22:37:18.87234	2026-07-05 22:37:19.757606	\N
0e9cea5a-26c0-4a24-9b07-74676709b9cb	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	CANCELLED	f	48000	2	don test	f	2026-07-05 16:29:02.756806	2026-07-05 16:29:02.756806	\N
04904509-4c29-427d-8133-c636bc48c51a	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	CANCELLED	f	222000	3	\N	f	2026-07-05 16:29:02.763012	2026-07-05 16:29:02.763012	\N
2171c3be-7de3-4162-bf16-85a77b7cde1e	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	CANCELLED	f	273000	4	\N	f	2026-07-05 16:29:02.769652	2026-07-05 16:29:02.769652	\N
6b503c28-27d0-4ccf-b283-f09595b0ad8b	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	f	219000	8	\N	f	2026-07-05 16:29:02.790883	2026-07-05 16:29:02.790883	\N
5d0858d8-29d0-42a6-8fa5-3f5f06b4fbad	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	CANCELLED	f	271000	9	\N	f	2026-07-05 16:29:02.796847	2026-07-05 16:29:02.796847	\N
0d9f6a7e-f5a1-460c-981f-3afe8e783cfb	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	CANCELLED	f	87000	10	\N	t	2026-07-05 16:29:02.80318	2026-07-05 16:29:02.80318	\N
d2298028-4cdc-4bf6-b933-3556146e556d	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	CANCELLED	f	39000	2	don test	f	2026-07-05 16:29:02.826892	2026-07-05 16:29:02.826892	\N
5073889c-90c3-4d8c-925c-f2c0504b2f13	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	CANCELLED	f	260000	3	\N	f	2026-07-05 16:29:02.832112	2026-07-05 16:29:02.832112	\N
b45d611b-ee37-4238-adca-e84d116f61a7	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	CANCELLED	f	194000	4	\N	f	2026-07-05 16:29:02.837054	2026-07-05 16:29:02.837054	\N
e1ff76fb-27db-4603-a126-56313bc2552f	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	CANCELLED	f	251000	8	\N	f	2026-07-05 16:29:02.863555	2026-07-05 16:29:02.863555	\N
fd941889-5b8d-4408-92dc-ba1a16e1ebdb	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	CANCELLED	f	379000	9	\N	f	2026-07-05 16:29:02.869061	2026-07-05 16:29:02.869061	\N
7ad37714-4a1b-46e1-93f1-4f27582a95ba	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	CANCELLED	f	144000	10	\N	t	2026-07-05 16:29:02.874523	2026-07-05 16:29:02.874523	\N
983511e4-f27a-4be0-a300-9aa95bf62cc0	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	39000	432	\N	f	2026-07-07 12:09:01.561044	2026-07-07 12:09:37.649224	\N
23c20332-2eb2-422d-9b45-e80333568a54	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	CANCELLED	f	39000	2	don test	f	2026-07-05 16:29:02.902894	2026-07-05 16:29:02.902894	\N
38484833-7527-4ff4-8f4a-b3cf9c3bb06e	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	CANCELLED	f	135000	3	\N	f	2026-07-05 16:29:02.908187	2026-07-05 16:29:02.908187	\N
2dcd2587-260b-4bb0-80aa-ceffbd556a40	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	CANCELLED	f	131000	4	\N	f	2026-07-05 16:29:02.913151	2026-07-05 16:29:02.913151	\N
968e2fab-fa28-4561-9a29-8ab489799199	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	f	339000	9	\N	f	2026-07-05 16:29:02.945164	2026-07-05 16:29:02.945164	\N
85eb605a-0420-4ebe-ad1c-aec997975636	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	CANCELLED	f	135000	10	\N	t	2026-07-05 16:29:02.957281	2026-07-05 16:29:02.957281	\N
88a6480d-6c42-4949-8355-8933e9f2d40c	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	CANCELLED	f	15000	2	don test	f	2026-07-05 16:29:02.983611	2026-07-05 16:29:02.983611	\N
027652d1-eec8-44fd-85c5-d306bd452c75	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	CANCELLED	f	195000	3	\N	f	2026-07-05 16:29:02.989517	2026-07-05 16:29:02.989517	\N
7e56f6e2-86a2-4178-bdde-4161372c81db	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	CANCELLED	f	258000	4	\N	f	2026-07-05 16:29:02.997062	2026-07-05 16:29:02.997062	\N
86f74558-12cf-4808-97f7-b81f552f2c83	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	CANCELLED	f	243000	8	\N	f	2026-07-05 16:29:03.025355	2026-07-05 16:29:03.025355	\N
e60cb863-d41d-48d1-863f-8b07800cc18f	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	CANCELLED	f	355000	9	\N	f	2026-07-05 16:29:03.030991	2026-07-05 16:29:03.030991	\N
7f8818bf-08e7-4d81-a371-9d58bd4abfc8	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	CANCELLED	f	162000	10	\N	t	2026-07-05 16:29:03.037244	2026-07-05 16:29:03.037244	\N
349e7821-dac8-4606-bff3-5f544297634f	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	270000	8	\N	f	2026-07-05 16:29:02.934346	2026-07-05 17:35:52.0026	\N
2245ec02-1c83-41a9-98b9-2646e23d33a5	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	CANCELLED	f	198000	3	\N	f	2026-07-05 16:29:03.067406	2026-07-05 16:29:03.067406	\N
a04910ff-ee68-4e08-a507-f099ad2e8b96	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	CANCELLED	f	303000	4	\N	f	2026-07-05 16:29:03.072342	2026-07-05 16:29:03.072342	\N
728c80fc-3191-4910-8372-d5df87c45d64	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	CANCELLED	f	181000	8	\N	f	2026-07-05 16:29:03.098599	2026-07-05 16:29:03.098599	\N
2fa5104d-d411-47dc-8163-1f24d2794383	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	f	57000	10	\N	t	2026-07-05 16:29:03.107989	2026-07-05 16:29:03.107989	\N
f3536ff2-18fc-48d9-b7be-8a3e6e248fbf	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-07 12:05:08.645055	2026-07-07 12:05:08.733716	\N
9c3fdd21-3faa-4f6b-b113-3493bfee3d61	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	39000	432	\N	f	2026-07-07 12:05:08.706691	2026-07-07 12:06:00.138261	\N
efbce400-9601-4e48-bf62-0c3c7138771a	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	CANCELLED	f	48000	2	don test	f	2026-07-05 16:29:03.129415	2026-07-05 16:29:03.129415	\N
a959b675-08f3-4a90-956c-e0eeb9e30a2e	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	CANCELLED	f	243000	3	\N	f	2026-07-05 16:29:03.135092	2026-07-05 16:29:03.135092	\N
faef74eb-ec4f-4e0f-8b79-f8cfeada2260	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	CANCELLED	f	300000	4	\N	f	2026-07-05 16:29:03.14459	2026-07-05 16:29:03.14459	\N
6c076d47-0815-4323-b1da-1f3ac6da9c39	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	f	39000	432	\N	f	2026-07-07 12:09:36.48013	2026-07-07 12:09:36.48013	\N
b128e44f-2fc0-4573-84f1-6ee2e2fa899a	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	CANCELLED	f	251000	8	\N	f	2026-07-05 16:29:03.165385	2026-07-05 16:29:03.165385	\N
10018420-af21-4861-a769-8069eb2cbc80	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	CANCELLED	f	318000	9	\N	f	2026-07-05 16:29:03.171471	2026-07-05 16:29:03.171471	\N
0e338e9e-956d-4880-bd9a-ce0a9d71545d	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	CANCELLED	f	102000	10	\N	t	2026-07-05 16:29:03.177497	2026-07-05 16:29:03.177497	\N
6cf0576e-38a4-4000-b3b2-fa36e41395dc	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	t	78000	432	\N	f	2026-07-07 12:09:36.425257	2026-07-07 12:09:36.565196	\N
e3c82763-4f69-4f0f-86a6-03f45589fb57	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	CANCELLED	f	48000	2	don test	f	2026-07-05 16:29:03.200369	2026-07-05 16:29:03.200369	\N
cf25e11e-8170-4a9d-860d-0774c50e9caa	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	CANCELLED	f	195000	3	\N	f	2026-07-05 16:29:03.205428	2026-07-05 16:29:03.205428	\N
2f2e882d-6b1b-4dc9-b96d-b0a3bc25e26e	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	CANCELLED	f	214000	4	\N	f	2026-07-05 16:29:03.210084	2026-07-05 16:29:03.210084	\N
5596d42e-adb1-444a-9ad5-2d8405e82a94	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	CANCELLED	f	256000	8	\N	f	2026-07-05 16:29:03.242246	2026-07-05 16:29:03.242246	\N
e78383ec-4003-45a9-8bd1-be27e80bbaa9	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	CANCELLED	f	369000	9	\N	f	2026-07-05 16:29:03.248004	2026-07-05 16:29:03.248004	\N
4ffd3151-5e32-4822-b12d-78b23a830405	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	CANCELLED	f	39000	2	don test	f	2026-07-05 16:29:03.276463	2026-07-05 16:29:03.276463	\N
6e0f4622-08d5-44f9-bc6c-218a3012596a	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	CANCELLED	f	117000	3	\N	f	2026-07-05 16:29:03.283131	2026-07-05 16:29:03.283131	\N
42afde2f-2634-4839-ae2e-8bc3d385a1ad	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	CANCELLED	f	252000	4	\N	f	2026-07-05 16:29:03.288898	2026-07-05 16:29:03.288898	\N
0d93aaf7-76d9-4e71-9bdd-c06b5f237ad2	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	CANCELLED	f	299000	8	\N	f	2026-07-05 16:29:03.311265	2026-07-05 16:29:03.311265	\N
2c64dab6-f753-43ca-bc90-3c65e373c97e	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	CANCELLED	f	290000	9	\N	f	2026-07-05 16:29:03.317075	2026-07-05 16:29:03.317075	\N
d4d35487-ec82-4e6b-88e0-d469b48a224d	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	CANCELLED	f	207000	10	\N	t	2026-07-05 16:29:03.323055	2026-07-05 16:29:03.323055	\N
f3967700-6073-452f-adaa-2c7ad837dd8a	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	CANCELLED	f	39000	2	don test	f	2026-07-05 16:29:03.349907	2026-07-05 16:29:03.349907	\N
2acdde15-c4b7-44d2-9459-43e164e91768	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	CANCELLED	f	212000	3	\N	f	2026-07-05 16:29:03.354427	2026-07-05 16:29:03.354427	\N
e7658f0d-775e-4c95-a90c-508c7708da52	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	CANCELLED	f	274000	4	\N	f	2026-07-05 16:29:03.361242	2026-07-05 16:29:03.361242	\N
ba16f164-c6ab-45a1-b9b1-9742a40623d9	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	325000	9	\N	f	2026-07-05 16:29:03.103355	2026-07-05 17:35:52.0026	\N
6ff51ca2-2234-49f0-8ea8-845ff604863c	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	117000	10	\N	f	2026-07-05 16:29:03.254398	2026-07-05 17:35:52.0026	\N
966fbd84-9f46-4c83-ac86-167ec5a4fdea	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	CANCELLED	f	174000	8	\N	f	2026-07-05 16:29:03.390161	2026-07-05 16:29:03.390161	\N
5a39b9e7-80d2-4617-900e-7f9d60030176	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	CANCELLED	f	227000	9	\N	f	2026-07-05 16:29:03.395026	2026-07-05 16:29:03.395026	\N
bc79859a-0f04-4ab1-9995-f28f3c486ebb	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	CANCELLED	f	117000	10	\N	t	2026-07-05 16:29:03.39967	2026-07-05 16:29:03.39967	\N
2e71d7dd-1da9-4f97-96e3-dc006647cfb6	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	CANCELLED	t	304000	5	\N	f	2026-06-22 16:52:00.012437	2026-07-05 20:00:50.391715	\N
80572696-5775-4600-a4d7-5f70dec3d4e8	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	CANCELLED	f	48000	2	don test	f	2026-07-05 16:29:03.4214	2026-07-05 16:29:03.4214	\N
9ee83de7-5994-4be3-9240-601f5fc64726	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	CANCELLED	f	231000	3	\N	f	2026-07-05 16:29:03.428941	2026-07-05 16:29:03.428941	\N
a4c577cc-5c4a-4e9d-a724-027568d78d19	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	CANCELLED	f	268000	4	\N	f	2026-07-05 16:29:03.435351	2026-07-05 16:29:03.435351	\N
8961a5a0-1129-4a70-8c38-091cddf147b0	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-07 12:05:25.983822	2026-07-07 12:05:26.05075	\N
4d7e8a4a-621b-470d-b75a-38f6256ca0ba	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	CANCELLED	f	234000	8	\N	f	2026-07-05 16:29:03.455228	2026-07-05 16:29:03.455228	\N
96a00868-6cdc-4e53-a947-71efaad5de26	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	CANCELLED	f	296000	9	\N	f	2026-07-05 16:29:03.461373	2026-07-05 16:29:03.461373	\N
0f949dcc-a3c5-4894-bd48-dc9ea1129695	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	CANCELLED	f	117000	10	\N	t	2026-07-05 16:29:03.467367	2026-07-05 16:29:03.467367	\N
1e120cf9-6388-48a3-ba9e-23be93b8c716	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	39000	432	\N	f	2026-07-07 12:05:26.026857	2026-07-07 12:06:00.138261	\N
37e5fb34-f55a-4d9b-8c7c-7b85910e8e5b	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	CANCELLED	f	48000	2	don test	f	2026-07-05 16:29:03.489859	2026-07-05 16:29:03.489859	\N
485a5db2-20d5-454e-97e8-67d8d17e3aa4	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	CANCELLED	f	258000	3	\N	f	2026-07-05 16:29:03.494209	2026-07-05 16:29:03.494209	\N
96e87606-370a-421b-8dea-6249bd3e29ca	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	CANCELLED	f	194000	4	\N	f	2026-07-05 16:29:03.499158	2026-07-05 16:29:03.499158	\N
7bc70f63-16b8-4803-9492-7e75215bbf9c	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	78000	432	\N	f	2026-07-07 12:09:36.519837	2026-07-07 12:09:37.649224	\N
5679546f-c315-4c78-8939-139c10b3b820	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	CANCELLED	f	237000	8	\N	f	2026-07-05 16:29:03.522373	2026-07-05 16:29:03.522373	\N
276b140e-27bf-4d38-aa07-519779d64564	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	CANCELLED	f	371000	9	\N	f	2026-07-05 16:29:03.527589	2026-07-05 16:29:03.527589	\N
0cc41b4e-b50f-46d7-b380-045da829cfd9	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	CANCELLED	f	144000	10	\N	t	2026-07-05 16:29:03.533376	2026-07-05 16:29:03.533376	\N
82b6c6e8-bfae-4abf-8ae5-82bd2b01ae18	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	CANCELLED	t	324000	5	\N	f	2026-06-24 16:52:00.012437	2026-07-05 16:29:02.003011	\N
c28ecb74-46df-4957-95aa-742cce5577a2	852d224a-5304-42c0-b154-b87373601f0c	455d757c-5b9f-431a-8df6-8a08a6593dfb	CANCELLED	t	73000	11	\N	f	2026-07-03 16:52:00.012437	2026-07-05 16:29:02.044085	\N
c8c7e583-1732-41e4-b114-e51782e84a83	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	CANCELLED	t	262000	5	\N	f	2026-06-28 16:52:00.012437	2026-07-05 16:29:02.084288	\N
25fc0c4d-acef-497a-8024-8f9a77e7792d	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	CANCELLED	t	130000	11	\N	f	2026-06-23 16:52:00.012437	2026-07-05 16:29:02.120302	\N
e21c3277-6044-45cd-9a90-2c6903d8393d	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	CANCELLED	t	215000	5	\N	f	2026-07-05 16:52:00.012437	2026-07-05 16:29:02.162223	\N
f696a2a1-50de-448e-80ad-35dfceefa497	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	CANCELLED	t	138000	11	\N	f	2026-06-23 16:52:00.012437	2026-07-05 16:29:02.200287	\N
c04de75e-dc23-4072-9e8d-6ed6349282b8	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	CANCELLED	t	290000	5	\N	f	2026-07-04 16:52:00.012437	2026-07-05 16:29:02.24385	\N
ada5a2c8-6114-4820-adb6-4b1aba43f249	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	CANCELLED	t	156000	11	\N	f	2026-06-24 16:52:00.012437	2026-07-05 16:29:02.282701	\N
3d07fedf-6101-4538-b6b2-4bb5b42055bb	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	t	325000	5	\N	f	2026-07-01 16:52:00.012437	2026-07-05 16:29:02.32636	\N
13725580-c2fa-4e7f-acad-50ed90d2e9fa	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	CANCELLED	t	77000	11	\N	f	2026-06-29 16:52:00.012437	2026-07-05 16:29:02.362588	\N
e23d1f59-dd2a-452f-9e07-28f7c9b90667	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	CANCELLED	t	338000	5	\N	f	2026-07-04 16:52:00.012437	2026-07-05 16:29:02.402537	\N
c2d29eec-64eb-49fa-915f-0c7dc8e97d7e	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	CANCELLED	t	107000	11	\N	f	2026-07-02 16:52:00.012437	2026-07-05 16:29:02.440657	\N
a8cfcf5a-6d38-4c26-9551-625326ab3e9f	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	213000	5	\N	f	2026-06-26 16:52:00.012437	2026-07-05 16:29:02.476853	\N
ceec3fd0-f090-47f8-8193-c5327c7b1c7b	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	CANCELLED	t	282000	5	\N	f	2026-06-25 16:52:00.012437	2026-07-05 16:29:02.54716	\N
c767256e-f8a0-4bf2-89cc-1d34afe781d4	ed1d3c69-295e-437f-9b33-3d72ae4e1110	59571c52-f463-48f1-a479-92f79e18b952	CANCELLED	t	186000	11	\N	f	2026-06-29 16:52:00.012437	2026-07-05 16:29:02.587603	\N
76061146-c183-4a34-92aa-f5191d313c2b	e5288da2-9d5e-4e0c-9339-2d7fad98280a	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	CANCELLED	t	285000	5	\N	f	2026-06-27 16:52:00.012437	2026-07-05 16:29:02.630681	\N
f296fb32-736e-4969-95c8-d164d65f7234	86f40b69-226b-4fd9-a6be-c2350e80414e	8550ba5e-a514-4ade-8a2c-afe16ed93136	CANCELLED	t	126000	11	\N	f	2026-06-25 16:52:00.012437	2026-07-05 16:29:02.668005	\N
041ba300-8eaf-4030-8b12-1c2d8f54968b	964810e2-2ab7-4ef1-a7a7-0135b6a97e49	495acdbf-8390-4453-a5e1-a006d4e1c027	CANCELLED	t	345000	5	\N	f	2026-07-02 16:52:00.012437	2026-07-05 16:29:02.701649	\N
01c8bc9b-a775-4281-b20b-1a702b4add10	cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	becc656a-922a-4033-8920-329d36bf48c1	CANCELLED	t	97000	11	\N	f	2026-07-04 16:52:00.012437	2026-07-05 16:29:02.738495	\N
24744783-8606-4ab2-a135-c5c6ba8f3255	7f5400df-0871-476c-8801-5e10003a0092	4d43303c-3b38-4fe2-bcce-2dc297c2166c	CANCELLED	t	262000	5	\N	f	2026-06-24 16:52:00.012437	2026-07-05 16:29:02.775632	\N
e631a883-feed-4a6e-8358-c21491fb9629	e16507e4-92d7-4b58-b6d7-511719d58e29	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	CANCELLED	t	135000	11	\N	f	2026-06-30 16:52:00.012437	2026-07-05 16:29:02.809251	\N
ac25c267-4234-46bb-88dc-f5638cf5aaad	d4de89b7-447a-474b-afd5-ac839f1c637c	330b75a9-24d2-4997-98ef-374fe7236db4	CANCELLED	t	199000	5	\N	f	2026-06-25 16:52:00.012437	2026-07-05 16:29:02.843007	\N
e30f647f-b890-435d-b364-b42f8868a5d5	e0783377-30aa-4dbf-b15b-67cecedb7ad9	392ed68f-9a42-4753-b3f3-1a08417e2b47	CANCELLED	t	130000	11	\N	f	2026-07-03 16:52:00.012437	2026-07-05 16:29:02.880138	\N
42b1955d-66ab-4c9a-bf4d-646987bb9042	f120334b-f208-42a7-be4d-914a5655e238	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	CANCELLED	t	290000	5	\N	f	2026-06-29 16:52:00.012437	2026-07-05 16:29:02.918841	\N
c4b9d619-dd92-4793-b958-cc07c7a1bf8b	59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	450d7690-950c-4536-8a12-d74248f69658	CANCELLED	t	151000	11	\N	f	2026-07-01 16:52:00.012437	2026-07-05 16:29:02.964129	\N
79365398-fb1e-4df8-8a7c-98094626d5fb	5498fab4-8fdf-4f9a-b737-0555b3c48779	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	CANCELLED	t	77000	11	\N	f	2026-06-25 16:52:00.012437	2026-07-05 16:29:03.042003	\N
e3acce38-c5cf-4f2c-8b79-14c2a9a20c36	36032dbd-0ece-4f5a-9c3b-cfd980473af5	03f74e87-d68d-41aa-9eef-74ce2840901e	CANCELLED	t	336000	5	\N	f	2026-07-02 16:52:00.012437	2026-07-05 16:29:03.080045	\N
ff856eb3-eb12-493f-9cbf-a07b2f44f54b	334856b3-91a5-43e8-9350-f920cbc74f1a	eaf111d4-500e-47a4-95f9-ee279bc4bd18	CANCELLED	t	97000	11	\N	f	2026-06-22 16:52:00.012437	2026-07-05 16:29:03.112675	\N
0f848081-92c1-4db8-86fa-b04f216e6367	483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	c475046d-42b0-4096-a1e9-d0cc3663df3b	CANCELLED	t	213000	5	\N	f	2026-06-30 16:52:00.012437	2026-07-05 16:29:03.149506	\N
5b33b8c5-99d5-4cf0-8179-98e692b4e96e	f06359c6-8f36-4231-8998-f3732475979b	6b0825b9-f850-460f-b5cf-f09adbe39ba3	CANCELLED	t	126000	11	\N	f	2026-06-22 16:52:00.012437	2026-07-05 16:29:03.184492	\N
973cf85c-47e8-48ca-b9b8-7cc930d257ae	8ef93dd3-6e2d-4c21-83d4-57db6a61957a	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	CANCELLED	t	242000	5	\N	f	2026-07-02 16:52:00.012437	2026-07-05 16:29:03.217748	\N
491224b4-67b6-4949-a6f0-aabe7948b8c5	f47c34e9-69bc-4fac-ae25-a36dba679b53	5d1b20d2-27ad-437d-b941-38345b4e492a	CANCELLED	t	123000	11	\N	f	2026-06-27 16:52:00.012437	2026-07-05 16:29:03.259675	\N
b17b5499-7f54-4ead-bad8-0790316fc0a5	e21a2e18-cd90-47ce-b5bf-3a3992ed203b	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	CANCELLED	t	305000	5	\N	f	2026-06-23 16:52:00.012437	2026-07-05 16:29:03.293672	\N
8f873823-a697-4729-82ab-6cf037419229	9856335c-a360-4f28-8e0e-fb2bfd408513	b12e7046-fd45-41bb-925d-0a3ad92e6a73	CANCELLED	t	132000	11	\N	f	2026-07-05 16:52:00.012437	2026-07-05 16:29:03.330925	\N
eb95e40b-1d7d-46ba-b7c4-7532429a799e	0592c459-af4e-4312-b1a5-71a3907e0ba8	10e32ac4-ab80-4231-b604-303a0e9dc9d7	CANCELLED	t	390000	5	\N	f	2026-06-27 16:52:00.012437	2026-07-05 16:29:03.367418	\N
5b3efa4e-479b-43d9-8b09-c0382bf1e81d	6f6931a7-1baf-41b2-aadb-773ca0e51d02	417713ee-1c17-44ff-bd50-6f006d31025b	CANCELLED	t	97000	11	\N	f	2026-07-05 16:52:00.012437	2026-07-05 16:29:03.404122	\N
540a139f-d00a-4e33-825e-3c595ea0cd15	bcd461cc-3da0-4bb7-b533-a7d72b98ab43	eadad28b-1324-4ce7-bd9e-0abf49858875	CANCELLED	t	310000	5	\N	f	2026-06-25 16:52:00.012437	2026-07-05 16:29:03.43992	\N
e1aed205-677d-4482-81f1-e75721d09266	81c5306e-ba36-4d30-9b75-63e1663e7a87	1e45982f-c54f-4c7d-9579-abcd8375829f	CANCELLED	t	142000	11	\N	f	2026-06-22 16:52:00.012437	2026-07-05 16:29:03.474176	\N
\.


--
-- Data for Name: pager_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pager_tokens (id, number, status, "orderId", "createdAt", "updatedAt") FROM stdin;
0d6e36e4-ed9d-482f-b709-fa654d70de1e	991	COMPLETED	\N	2026-07-05 20:00:50.230716	2026-07-05 20:00:50.391715
3e7c2499-9c68-4e1e-9e04-da4896568939	785	COMPLETED	\N	2026-07-05 22:35:00.232224	2026-07-05 22:35:01.531391
2eb57b78-1e3b-4e77-9f95-7ae6cbe8df42	718	COMPLETED	\N	2026-07-05 22:37:21.519772	2026-07-05 22:37:22.641288
f239eea8-e6e4-4d63-966c-46234609a9f3	992	COMPLETED	\N	2026-07-05 20:03:02.655153	2026-07-05 22:51:48.374409
71d49b8b-7d21-4c87-a51f-6e2d8a01d993	856	COMPLETED	\N	2026-07-16 14:37:42.586135	2026-07-16 14:37:49.278992
551ee89b-90d1-42b7-b606-7f3174290516	750	COMPLETED	\N	2026-07-16 14:40:01.145421	2026-07-16 14:40:06.884253
4e2bb23f-42e1-4855-83c6-9518819910b3	700	COMPLETED	\N	2026-07-16 15:29:53.724988	2026-07-16 15:29:58.768647
ec5156f8-3fd2-4330-8a96-3490e8963e61	707	COMPLETED	\N	2026-07-16 15:33:44.695372	2026-07-16 15:33:50.05481
ac4c68e0-8435-4855-853a-f6c73b5b5e00	996	COMPLETED	\N	2026-07-16 15:34:57.933515	2026-07-16 15:35:01.899069
0c536fae-9e82-4a5e-9c00-7c0a6ef8de8d	765	COMPLETED	\N	2026-07-16 16:13:40.966626	2026-07-16 16:13:45.828708
a3c10d30-b02d-4dc3-8f90-36437c03345a	982	COMPLETED	\N	2026-07-16 16:40:05.399408	2026-07-16 16:40:10.711689
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, "categoryId", name, description, "imageUrl", price, "prepTime", status, "isActive", "sortOrder", "createdAt") FROM stdin;
abc7671f-64fc-479b-8425-269a99337fc9	a08562ea-6b6b-4140-a07b-baba6405947c	Cold Drip	Coffee - Cold Drip	\N	39000	3	AVAILABLE	t	1	2026-07-05 16:29:01.950943
988db5b6-220b-4523-acbf-63f2b5a704ec	a08562ea-6b6b-4140-a07b-baba6405947c	Chalo Coffee Dac Biet	Coffee - Chalo Coffee Dac Biet	\N	39000	3	AVAILABLE	t	3	2026-07-05 16:29:01.950943
c6596b7d-39d4-4637-a692-15bf6b08b02e	a08562ea-6b6b-4140-a07b-baba6405947c	Chalo Coffee Den Nau	Coffee - Chalo Coffee Den Nau	\N	29000	3	AVAILABLE	t	4	2026-07-05 16:29:01.950943
af247007-8aad-4e98-9fa8-d7f71822b787	a08562ea-6b6b-4140-a07b-baba6405947c	Ca Phe Kem Sua Hanh Nhan	Coffee - Ca Phe Kem Sua Hanh Nhan	\N	39000	3	AVAILABLE	t	5	2026-07-05 16:29:01.950943
4334294a-36f3-4de0-b6e7-2f7bee85dc82	a08562ea-6b6b-4140-a07b-baba6405947c	Ca Phe Kem Sua Dua	Coffee - Ca Phe Kem Sua Dua	\N	39000	3	AVAILABLE	t	6	2026-07-05 16:29:01.950943
b2578b52-864a-435f-a7bd-c63d182c0e93	a08562ea-6b6b-4140-a07b-baba6405947c	Ca Cao Sua Dua	Coffee - Ca Cao Sua Dua	\N	44000	3	AVAILABLE	t	7	2026-07-05 16:29:01.950943
ef12c6e9-eaf2-40e9-b563-f942d2ee8084	a08562ea-6b6b-4140-a07b-baba6405947c	Ca Phe Kem Muoi	Coffee - Ca Phe Kem Muoi	\N	34000	3	AVAILABLE	t	8	2026-07-05 16:29:01.950943
4a3077bd-4ab3-425c-9d49-b48ea4a5bfc8	a08562ea-6b6b-4140-a07b-baba6405947c	Cacao Kem Muoi	Coffee - Cacao Kem Muoi	\N	39000	3	AVAILABLE	t	9	2026-07-05 16:29:01.950943
b7c8f3a2-0494-4417-b871-5e687e7a919d	a08562ea-6b6b-4140-a07b-baba6405947c	Ca Phe Bac Xiu	Coffee - Ca Phe Bac Xiu	\N	34000	3	AVAILABLE	t	10	2026-07-05 16:29:01.950943
12aae6fb-fc6d-455f-9902-3904a4d0722e	a08562ea-6b6b-4140-a07b-baba6405947c	Ca Phe Sua Tuoi Caramel	Coffee - Ca Phe Sua Tuoi Caramel	\N	34000	3	AVAILABLE	t	11	2026-07-05 16:29:01.950943
e676c016-ead1-43be-9604-d6ab96a01c14	a08562ea-6b6b-4140-a07b-baba6405947c	Queen Nu Hoang	Coffee - Queen Nu Hoang	\N	34000	3	AVAILABLE	t	12	2026-07-05 16:29:01.950943
7842eb3d-d367-432b-a598-fbc626cfed25	7b469355-2c50-48d7-85b3-0c938df17423	Bau Troi Xanh	Matcha - Bau Troi Xanh	\N	48000	3	AVAILABLE	t	13	2026-07-05 16:29:01.950943
84a4f1d1-4fcc-4642-ac48-16d12841f9b8	7b469355-2c50-48d7-85b3-0c938df17423	Dai Duong Xanh	Matcha - Dai Duong Xanh	\N	48000	3	AVAILABLE	t	14	2026-07-05 16:29:01.950943
77b1a449-5699-4660-8a4e-6219cd2367ae	7b469355-2c50-48d7-85b3-0c938df17423	Thao Nguyen Xanh	Matcha - Thao Nguyen Xanh	\N	48000	3	AVAILABLE	t	15	2026-07-05 16:29:01.950943
3a74275b-1d45-446f-8dfb-b0fb26b06bde	7b469355-2c50-48d7-85b3-0c938df17423	Hoa Vang Tren Co Xanh	Matcha - Hoa Vang Tren Co Xanh	\N	48000	3	AVAILABLE	t	16	2026-07-05 16:29:01.950943
8f714059-5383-441c-b0e0-7204b813ac3f	7b469355-2c50-48d7-85b3-0c938df17423	Hong Hai Nhi	Matcha - Hong Hai Nhi	\N	54000	3	AVAILABLE	t	17	2026-07-05 16:29:01.950943
b4a42867-66b4-4a0a-bee1-149fbe066e67	7b469355-2c50-48d7-85b3-0c938df17423	Matcha Latte	Matcha - Matcha Latte	\N	39000	3	AVAILABLE	t	18	2026-07-05 16:29:01.950943
200acb2a-70d5-4d67-874f-0a0b0d063436	7b469355-2c50-48d7-85b3-0c938df17423	Matcha Tra Sen	Matcha - Matcha Tra Sen	\N	48000	3	AVAILABLE	t	19	2026-07-05 16:29:01.950943
bb86f6d1-7657-4933-b1ac-8ea48dbde363	2ae31b5b-dd97-4f90-85a0-38ac16378717	Tra Sua Chalo Nguyen Vi	Tra Dam Vi - Tra Sua - Tra Sua Chalo Nguyen Vi	\N	34000	3	AVAILABLE	t	20	2026-07-05 16:29:01.950943
03adf784-c4c7-4adc-b126-3b0e89df4088	2ae31b5b-dd97-4f90-85a0-38ac16378717	Tra Sua Chalo Mix Vi	Tra Dam Vi - Tra Sua - Tra Sua Chalo Mix Vi	\N	39000	3	AVAILABLE	t	21	2026-07-05 16:29:01.950943
6536b909-e896-4b45-a718-bd32957079b8	2ae31b5b-dd97-4f90-85a0-38ac16378717	Tra Sua Chalo Viet Quat	Tra Dam Vi - Tra Sua - Tra Sua Chalo Viet Quat	\N	39000	3	AVAILABLE	t	22	2026-07-05 16:29:01.950943
fd530e34-adf8-429e-86ea-a82e764cc969	2ae31b5b-dd97-4f90-85a0-38ac16378717	Tra Sua Chalo Chanh Leo Thach Dua	Tra Dam Vi - Tra Sua - Tra Sua Chalo Chanh Leo Thach Dua	\N	39000	3	AVAILABLE	t	23	2026-07-05 16:29:01.950943
96e64c37-45c5-445f-9d69-e9045847be16	2ae31b5b-dd97-4f90-85a0-38ac16378717	Tra Dao Cam Que Nong	Tra Dam Vi - Tra Sua - Tra Dao Cam Que Nong	\N	39000	3	AVAILABLE	t	24	2026-07-05 16:29:01.950943
d35a62bb-0c87-40fa-8ddb-b9cb172d7ae4	2ae31b5b-dd97-4f90-85a0-38ac16378717	Tra Dao Ton Ngo Khong	Tra Dam Vi - Tra Sua - Tra Dao Ton Ngo Khong	\N	48000	3	AVAILABLE	t	25	2026-07-05 16:29:01.950943
fab37b98-ccfc-407a-a3f5-ba7e7f905264	2ae31b5b-dd97-4f90-85a0-38ac16378717	Tra Cu Chalo Dam Vi	Tra Dam Vi - Tra Sua - Tra Cu Chalo Dam Vi	\N	45000	3	AVAILABLE	t	26	2026-07-05 16:29:01.950943
3c4f01bb-5e5b-431f-b492-2f615ef579a2	2ae31b5b-dd97-4f90-85a0-38ac16378717	Phuong Hoang	Tra Dam Vi - Tra Sua - Phuong Hoang	\N	48000	3	AVAILABLE	t	27	2026-07-05 16:29:01.950943
32225b18-cd42-4ce0-95bc-5c15353c89e9	2ae31b5b-dd97-4f90-85a0-38ac16378717	Hang Nga	Tra Dam Vi - Tra Sua - Hang Nga	\N	48000	3	AVAILABLE	t	28	2026-07-05 16:29:01.950943
3b0030ad-e18f-4a53-bd08-3d9264c306e3	2ae31b5b-dd97-4f90-85a0-38ac16378717	Sac Xuan	Tra Dam Vi - Tra Sua - Sac Xuan	\N	58000	3	AVAILABLE	t	29	2026-07-05 16:29:01.950943
fef374cf-9486-4dc9-aacb-02ebf30a6cab	aed08d71-3e23-4645-869d-6cfb7848f9e3	Sinh To Trai Cay Theo Mua	Trai Cay Tuoi - Sinh To Trai Cay Theo Mua	\N	48000	3	AVAILABLE	t	30	2026-07-05 16:29:01.950943
1b1829c3-8f31-4bb5-9fad-fcf7f094d496	aed08d71-3e23-4645-869d-6cfb7848f9e3	Sinh To Sua Chua Mat Ong	Trai Cay Tuoi - Sinh To Sua Chua Mat Ong	\N	55000	3	AVAILABLE	t	31	2026-07-05 16:29:01.950943
3ebdf852-8304-40f4-8a8c-b5a74a6fd7b5	aed08d71-3e23-4645-869d-6cfb7848f9e3	Sinh To Sau Rieng	Trai Cay Tuoi - Sinh To Sau Rieng	\N	69000	3	AVAILABLE	t	32	2026-07-05 16:29:01.950943
6ec836b1-483e-4125-a2fa-3261bbb6a2a9	aed08d71-3e23-4645-869d-6cfb7848f9e3	Nuoc Ep Dua	Trai Cay Tuoi - Nuoc Ep Dua	\N	39000	3	AVAILABLE	t	33	2026-07-05 16:29:01.950943
c9dee998-960c-4fba-b13d-03fd01bfe465	aed08d71-3e23-4645-869d-6cfb7848f9e3	Nuoc Ep Dua Hau	Trai Cay Tuoi - Nuoc Ep Dua Hau	\N	39000	3	AVAILABLE	t	34	2026-07-05 16:29:01.950943
2ed6795b-47b9-4e49-8780-7f6ed2d04bff	aed08d71-3e23-4645-869d-6cfb7848f9e3	Nuoc Ep Cam	Trai Cay Tuoi - Nuoc Ep Cam	\N	39000	3	AVAILABLE	t	35	2026-07-05 16:29:01.950943
701776fb-649f-4d96-bff2-49c4f86301a8	aed08d71-3e23-4645-869d-6cfb7848f9e3	Nuoc Ep Luu	Trai Cay Tuoi - Nuoc Ep Luu	\N	48000	3	AVAILABLE	t	36	2026-07-05 16:29:01.950943
60cdd4b1-569d-4c49-b97a-dda6fc8d478e	aed08d71-3e23-4645-869d-6cfb7848f9e3	Trang Non	Trai Cay Tuoi - Trang Non	\N	54000	3	AVAILABLE	t	37	2026-07-05 16:29:01.950943
dccd90cd-5d97-4729-acc1-c9079a3b2a24	99eb9832-8f6a-4abc-967e-56f0d2b71dd1	Bay Lac Cung Chalo	Sua Chua - Bay Lac Cung Chalo	\N	48000	3	AVAILABLE	t	38	2026-07-05 16:29:01.950943
626b2101-5a08-41bf-92c4-8c4036fdbf05	99eb9832-8f6a-4abc-967e-56f0d2b71dd1	Chu Cuoi	Sua Chua - Chu Cuoi	\N	48000	3	AVAILABLE	t	39	2026-07-05 16:29:01.950943
6e636365-bf5a-43f6-9eac-2b5c7e9e1a59	99eb9832-8f6a-4abc-967e-56f0d2b71dd1	Mo Suong	Sua Chua - Mo Suong	\N	39000	3	AVAILABLE	t	40	2026-07-05 16:29:01.950943
2384e9ff-6f5e-4c39-b206-41f6e4dc4c4d	99eb9832-8f6a-4abc-967e-56f0d2b71dd1	Sua Chua Ca Phe	Sua Chua - Sua Chua Ca Phe	\N	39000	3	AVAILABLE	t	41	2026-07-05 16:29:01.950943
b6f1bc16-c804-4e3f-a496-f2ca209e3d6a	99eb9832-8f6a-4abc-967e-56f0d2b71dd1	Sua Chua Xoai	Sua Chua - Sua Chua Xoai	\N	39000	3	AVAILABLE	t	42	2026-07-05 16:29:01.950943
92f6430c-9ca3-4aa7-96df-72ff2a156bfb	99eb9832-8f6a-4abc-967e-56f0d2b71dd1	Sua Chua Viet Quat	Sua Chua - Sua Chua Viet Quat	\N	39000	3	AVAILABLE	t	43	2026-07-05 16:29:01.950943
abf1ca96-26fb-4d12-a7ef-96303f28704f	99eb9832-8f6a-4abc-967e-56f0d2b71dd1	Sua Chua Dua	Sua Chua - Sua Chua Dua	\N	39000	3	AVAILABLE	t	44	2026-07-05 16:29:01.950943
4c03576e-6b02-4ed8-9d33-bf143e2614ed	17552de5-13ce-4aa3-881d-4f2295e68878	Bim Bim	Do An Vat - Bim Bim	\N	8000	1	AVAILABLE	t	45	2026-07-05 16:29:01.950943
a2e2eb97-6d2b-4a06-a47f-5076d676bcd3	17552de5-13ce-4aa3-881d-4f2295e68878	Hat Huong Duong	Do An Vat - Hat Huong Duong	\N	15000	1	AVAILABLE	t	46	2026-07-05 16:29:01.950943
1d1c0124-29f5-4ded-b2ef-9787c984f06a	17552de5-13ce-4aa3-881d-4f2295e68878	Hat Bi Hat Dua	Do An Vat - Hat Bi Hat Dua	\N	19000	1	AVAILABLE	t	47	2026-07-05 16:29:01.950943
b63887ff-87f2-486b-ad9e-fbc5511844b3	17552de5-13ce-4aa3-881d-4f2295e68878	Kho Ga Kho Bo Kho Heo	Do An Vat - Kho Ga Kho Bo Kho Heo	\N	19000	1	AVAILABLE	t	48	2026-07-05 16:29:01.950943
0d8c0456-172e-4007-92eb-7965c7571a94	17552de5-13ce-4aa3-881d-4f2295e68878	Snack Bong Ngo My	Do An Vat - Snack Bong Ngo My	\N	19000	1	AVAILABLE	t	49	2026-07-05 16:29:01.950943
833e2485-0cd8-40f0-b222-1702c68c43d3	a08562ea-6b6b-4140-a07b-baba6405947c	Capuchino Lạnh	Coffee - Capuchino Lanh		39000	3	AVAILABLE	t	2	2026-07-05 16:29:01.950943
\.


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tables (id, name, area, status, "qrToken", "createdAt") FROM stdin;
6f6931a7-1baf-41b2-aadb-773ca0e51d02	Ban 01	\N	OCCUPIED	417713ee-1c17-44ff-bd50-6f006d31025b	2026-07-05 16:29:01.966993
f47c34e9-69bc-4fac-ae25-a36dba679b53	Ban 02	\N	OCCUPIED	5d1b20d2-27ad-437d-b941-38345b4e492a	2026-07-05 16:29:01.966993
334856b3-91a5-43e8-9350-f920cbc74f1a	Ban 03	\N	AVAILABLE	eaf111d4-500e-47a4-95f9-ee279bc4bd18	2026-07-05 16:29:01.966993
59a9c5a6-073e-4d10-b8f9-02167b5f9a4d	Ban 04	\N	AVAILABLE	450d7690-950c-4536-8a12-d74248f69658	2026-07-05 16:29:01.966993
e16507e4-92d7-4b58-b6d7-511719d58e29	Ban 05	\N	AVAILABLE	13282e0d-8712-4e2b-96b9-d4cc33b05dd3	2026-07-05 16:29:01.966993
86f40b69-226b-4fd9-a6be-c2350e80414e	Ban 06	\N	AVAILABLE	8550ba5e-a514-4ade-8a2c-afe16ed93136	2026-07-05 16:29:01.966993
bcd461cc-3da0-4bb7-b533-a7d72b98ab43	Ban 07	\N	AVAILABLE	eadad28b-1324-4ce7-bd9e-0abf49858875	2026-07-05 16:29:01.966993
e21a2e18-cd90-47ce-b5bf-3a3992ed203b	Ban 08	\N	AVAILABLE	7e6ab2e5-fb6a-4023-9e0f-a16d5641517e	2026-07-05 16:29:01.966993
483ffbe7-5877-4bbc-bbf4-7aca464bc8ce	Ban 09	\N	AVAILABLE	c475046d-42b0-4096-a1e9-d0cc3663df3b	2026-07-05 16:29:01.966993
852d224a-5304-42c0-b154-b87373601f0c	Ban 10	\N	AVAILABLE	455d757c-5b9f-431a-8df6-8a08a6593dfb	2026-07-05 16:29:01.966993
d4de89b7-447a-474b-afd5-ac839f1c637c	Ban 11	\N	AVAILABLE	330b75a9-24d2-4997-98ef-374fe7236db4	2026-07-05 16:29:01.966993
964810e2-2ab7-4ef1-a7a7-0135b6a97e49	Ban 12	\N	AVAILABLE	495acdbf-8390-4453-a5e1-a006d4e1c027	2026-07-05 16:29:01.966993
81c5306e-ba36-4d30-9b75-63e1663e7a87	Ban 13	\N	AVAILABLE	1e45982f-c54f-4c7d-9579-abcd8375829f	2026-07-05 16:29:01.966993
9856335c-a360-4f28-8e0e-fb2bfd408513	Ban 14	\N	AVAILABLE	b12e7046-fd45-41bb-925d-0a3ad92e6a73	2026-07-05 16:29:01.966993
f06359c6-8f36-4231-8998-f3732475979b	Ban 15	\N	AVAILABLE	6b0825b9-f850-460f-b5cf-f09adbe39ba3	2026-07-05 16:29:01.966993
5498fab4-8fdf-4f9a-b737-0555b3c48779	Ban 16	\N	AVAILABLE	78ccdaa3-86bf-4519-9010-b7f94ba5bfe9	2026-07-05 16:29:01.966993
e0783377-30aa-4dbf-b15b-67cecedb7ad9	Ban 17	\N	AVAILABLE	392ed68f-9a42-4753-b3f3-1a08417e2b47	2026-07-05 16:29:01.966993
cf1cb342-e86b-4a8a-845b-1eb5f3e02e54	Ban 18	\N	AVAILABLE	becc656a-922a-4033-8920-329d36bf48c1	2026-07-05 16:29:01.966993
ed1d3c69-295e-437f-9b33-3d72ae4e1110	Ban 19	\N	AVAILABLE	59571c52-f463-48f1-a479-92f79e18b952	2026-07-05 16:29:01.966993
0592c459-af4e-4312-b1a5-71a3907e0ba8	Ban 20	\N	AVAILABLE	10e32ac4-ab80-4231-b604-303a0e9dc9d7	2026-07-05 16:29:01.966993
8ef93dd3-6e2d-4c21-83d4-57db6a61957a	Ban 21	\N	AVAILABLE	b842fbe4-d2ac-4b2b-be76-c4f19a4e053b	2026-07-05 16:29:01.966993
36032dbd-0ece-4f5a-9c3b-cfd980473af5	Ban 22	\N	AVAILABLE	03f74e87-d68d-41aa-9eef-74ce2840901e	2026-07-05 16:29:01.966993
f120334b-f208-42a7-be4d-914a5655e238	Ban 23	\N	AVAILABLE	3328f2a6-3a35-4d22-bf22-8ffc24850bc3	2026-07-05 16:29:01.966993
7f5400df-0871-476c-8801-5e10003a0092	Ban 24	\N	AVAILABLE	4d43303c-3b38-4fe2-bcce-2dc297c2166c	2026-07-05 16:29:01.966993
e5288da2-9d5e-4e0c-9339-2d7fad98280a	Ban 25	\N	AVAILABLE	c2bb41ff-a802-4a7d-badf-8c10b32ce43d	2026-07-05 16:29:01.966993
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, "fullName", avatar, role, "isActive", "currentRefreshTokenHash", "createdAt") FROM stdin;
35	cust_e2e_1784212800047	$2b$10$6yHM0FAYRpy8YacLAxGETuMdQ1LJWyD1L6ZCtyzVQLeDhd8f8fdQ.	E2E Customer	\N	CUSTOMER	t	$2b$10$VnrLLgqydEPXtWXLTqOhc.Te2WMZpPT/vpZtQdk/xt9k0FIT1c9pa	2026-07-16 14:40:03.166076
49	cust_e2e_dup_1784216099583	$2b$10$Pv9K3w7i/OKBBXcJuRc0.uw/tWPIZ8uJrTJZTJ6MFYyog95btVEBC	Dup Seed	\N	CUSTOMER	t	$2b$10$7ZRTgIabY7E67fykHLbb3eGihBGU3suTVlIhT2PySMOtgDdclhCs2	2026-07-16 15:34:59.70936
41	cust_e2e_1784215909928	$2b$10$1eUKI5l0KJoUH5.VEaJorucNc8B6ChA79zDUEYj07e7x3gKnTVrCG	E2E Customer	\N	CUSTOMER	t	$2b$10$vkG0KsRK9YawmEyMgMuB9umSYRaNOy1VAmuTrk/hdJsOtpLdr62F6	2026-07-16 15:31:51.63211
36	cust_e2e_dup_1784212804706	$2b$10$/Lyd2TvB06EF2O07O.BNXe91wQEf2XzZsp5IA2GnMCDp1/XH1PR2C	Dup Seed	\N	CUSTOMER	t	$2b$10$Q51aQkrc/CfAnvhRFP4XR./c.vqWwfHnmOjXwulXu3Y6T1daBRK.y	2026-07-16 14:40:04.82215
42	cust_e2e_dup_1784215912641	$2b$10$X1k.uUKwpdybdNDSKKeDZuLgFJd/K5HkyFOcSb9uswl1SbLzTE04m	Dup Seed	\N	CUSTOMER	t	$2b$10$VWgylScKaBsiVcNmXGBqaOV6DPZplcbIA9ad6rdFZFvVG2RY583Ca	2026-07-16 15:31:52.849433
43	cust_e2e_dup_1784215912840	$2b$10$CiCHi2pvddSYGSnIXAUaQeV42mM6Q5J8aiKbI9u18.CrXVfE12Ckq	Dup Seed	\N	CUSTOMER	t	$2b$10$h.y4Y0xnEkesh1tbpIZQpeKeE0r0kwH3ALoW6TXD5qLgcjyYQGgAi	2026-07-16 15:31:52.957621
29	e2e_staff_1784212659028	$2b$10$qoO2qKpjdtbywwdZy/EyP.hN3UeM5rMbT9vDGDtZEtV/0zIfkm0G.	E2E Staff Bot	\N	MODERATOR	t	\N	2026-07-16 14:37:39.927691
46	cust_e2e_dup_1784216028350	$2b$10$1aU1sA.7z.xwvKoLXV0TkO58B968.juCQKZSYbiYNdsYPuF3KqBXG	Dup Seed	\N	CUSTOMER	t	$2b$10$K3JLM.6PkHy9Ss21hbWC8u042LIH4r9iUUJr8kwYzOaRRGwCbV1FK	2026-07-16 15:33:48.464273
51	cust_e2e_1784218420327	$2b$10$3YrNKKdkjQXYJS5UVX0JwOjYjWqC9ma14OMSvwD.ZrTtM8CTvDW9.	E2E Customer	\N	CUSTOMER	t	$2b$10$G/un8uHM4Lrdyh5SUJwRgOC5TaKAT451zkQSpdMa9NQYM1iB7ihYW	2026-07-16 16:13:43.240922
30	cust_e2e_1784212658569	$2b$10$KEBMsuO4g09yTS1rK/z8Aec/G5bf24tcED7Js6HvFPpZ0regtez5K	E2E Customer	\N	CUSTOMER	t	$2b$10$cdLjzW/PFjRBN/ytdU.tK.BYFqR2xAw4VpcgOp.fIb8nY9u9i.3TW	2026-07-16 14:37:45.132242
54	cust_e2e_1784220004611	$2b$10$amEd80vAjV/riPlx2v4//.GAztBCgdjR5RsFxLrqlCwP3SgH6bo/2	E2E Customer	\N	CUSTOMER	t	$2b$10$OyAE7yjKVetFazxBxP3f8OdAVT.iC2d3QSi99L2si0xvmFWf1iyP2	2026-07-16 16:40:07.927073
31	cust_e2e_dup_1784212668279	$2b$10$K3zV.GSDqEp6u7VbkJfw/u6r4TJKskDZs6z7C17cRb5UXfqQSv8uG	Dup Seed	\N	CUSTOMER	t	$2b$10$iS8DNT254.osUwSYe5HfZOyYtYratHomWuOrqVVpwj8xK6QafcJ4S	2026-07-16 14:37:48.481626
32	cust_e2e_1784212751747	$2b$10$ZLCGKjYGvrvZ9Z.mhHg4te/yCJdJThudWpvLndKHRB/T.IaWfxWEi	E2E Customer	\N	CUSTOMER	t	$2b$10$.Z7XIcV456kypb3CYBYD5eTnh/VtYMOLoxkG8CvYff0soHNfnUftG	2026-07-16 14:39:12.445495
33	cust_e2e_dup_1784212752959	$2b$10$joNRKZa0eAT8HrY90DJcOugxxgH4Fh2stv6wEDnXHu5xNQGwtd5DK	Dup Seed	\N	CUSTOMER	t	$2b$10$ZRsogT62QguF4KWVSM8KOe7EyCtuMAPsVoPp5PoSnCL.pucw5OvAe	2026-07-16 14:39:13.08449
37	e2e_staff_1784215791828	$2b$10$qqW9o1rHG2I4ZL5rDgIu.eGkiihZt8kW.cB3Hawn1v.lgmz7.Z9MO	E2E Staff Bot	\N	MODERATOR	t	\N	2026-07-16 15:29:52.594994
52	cust_e2e_dup_1784218424091	$2b$10$ajR0T3s9g2/oGIslcIm4tuh/Ktg78rs7dl4xVKsdZN3OLggJOJ.1S	Dup Seed	\N	CUSTOMER	t	$2b$10$zgjZE197rAKVvB5QqQXD4ODjxp5hBPHXlO.sQtUqL4.R.akFW2iXK	2026-07-16 16:13:44.188156
38	cust_e2e_1784215792501	$2b$10$u88vorfKbTdqFyOcYVZHjeSE6e9a/LDdWDM7x5CKHHeKqpDq.1IIu	E2E Customer	\N	CUSTOMER	t	$2b$10$CfK504mAwqXcaY4T2w7GSuovXWMfI1ZjZlT6fqmxNk0iIgJTiCEl.	2026-07-16 15:29:55.611443
2	staff	$2b$10$7E9DXuEIaDkZnodAWS0Ameg4XLTXd4hOnhsE1iQvaqRH5K/QyPFSu	Staff	\N	MODERATOR	t	\N	2026-07-05 16:29:01.931492
34	e2e_staff_1784212798121	$2b$10$Hoj3zJxPOeXMAjOXODHvae.LlZXiKQpUyRpsr6l0MlRXyZLf8IWR6	E2E Staff Bot	\N	MODERATOR	t	\N	2026-07-16 14:39:59.003294
44	e2e_staff_1784216023531	$2b$10$RKfCliUSTHr2oU7AQ/UFROfFQKf/cQnkEXjteuzmatPSpAY18KSLm	E2E Staff Bot	\N	MODERATOR	t	\N	2026-07-16 15:33:44.115908
47	e2e_staff_1784216095869	$2b$10$TJW0UNsmN405xg9DQfhjeu6neWjYKaIMn/QTSWHVF9X7sTeP4xD6q	E2E Staff Bot	\N	MODERATOR	t	\N	2026-07-16 15:34:56.56543
39	cust_e2e_dup_1784215798523	$2b$10$CDnhUE19lZgLmwy2tGpJVOys.ZKgkqU0yARCNLhPSYhJeKYrYsyve	Dup Seed	\N	CUSTOMER	t	$2b$10$0K1/QBiWW8ea379oUqPqFOSyqtLfMOCFF47ZEecLm1hKzAPQKSs9C	2026-07-16 15:29:58.666844
40	cust_e2e_1784215909644	$2b$10$AtD0fbGYvCbjf8sb43g.d.l8xRPZstbPaDBdbjwtSxqI.fbwdsFty	E2E Customer	\N	CUSTOMER	t	$2b$10$dwnNrbYH80Uk3twBgFwkZevlYqbJllhleKRJ5RAqKfihO3mrjMl3S	2026-07-16 15:31:51.535163
53	e2e_staff_1784220004441	$2b$10$CA3W1TkX7CQAoRkiX3zS..SnMvvyVsTy4R/blli5zFN1GQ96Iymfm	E2E Staff Bot	\N	MODERATOR	t	\N	2026-07-16 16:40:05.12857
45	cust_e2e_1784216024232	$2b$10$Iq5bZX7X3u2ejpV1R64cN.UFBzezGsgcrzk6rQNTpPyEzpW9AGP3W	E2E Customer	\N	CUSTOMER	t	$2b$10$DOgeRGZ/7QCx/nVErXWbkegrt5nPl36k7NNqA1URv1mPWSUx5kj8.	2026-07-16 15:33:47.155838
50	e2e_staff_1784218419757	$2b$10$f8QL7Olgp9ALtuLUVeN.NulYSepObZaebJDgZ9YJpwEkfZ.P/PhF.	E2E Staff Bot	\N	MODERATOR	t	\N	2026-07-16 16:13:40.342039
48	cust_e2e_1784216094795	$2b$10$RT2XPRpo4g6saQ5OpeHlZO2IG8UpkFckhJYuco8ZepFqoQ.8aNsna	E2E Customer	\N	CUSTOMER	t	$2b$10$.LGar4.QJJzvenvzZYPsTOHnu8RH84yHnBFUwjsud6.196MxaZjje	2026-07-16 15:34:58.036663
55	cust_e2e_dup_1784220008872	$2b$10$ncgsE7snsoedFSec5WgPUeYqbZMFZ8syCNccHmDzpTEVZd7XJezlO	Dup Seed	\N	CUSTOMER	t	$2b$10$qF1g3QEujIMBdy0FTTGzqes25GSyw.WvnhY35Njm1xwzbWHBH./ta	2026-07-16 16:40:09.011723
1	admin	$2b$10$PS9mk4WBWV19Buoyx9ed7OWT8gYTuXIY7xfu3vzLnPINpRQ54QGyG	Admin	\N	ADMIN	t	$2b$10$/bCiPxgBcuZweu/4gWxQNeCNZkT9WoHV7IbtViAwiYsa3tTguqGTG	2026-07-05 16:29:01.931492
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 55, true);


--
-- Name: order_items PK_005269d8574e6fac0493715c308; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY (id);


--
-- Name: products PK_0806c755e0aca124e67c0cf6d7d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY (id);


--
-- Name: categories PK_24dbc6126a28ff948da33e97d3b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY (id);


--
-- Name: checkout_sessions PK_5730b2bbc190203a94941d82bd1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checkout_sessions
    ADD CONSTRAINT "PK_5730b2bbc190203a94941d82bd1" PRIMARY KEY (id);


--
-- Name: orders PK_710e2d4957aa5878dfe94e4ac2f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY (id);


--
-- Name: tables PK_7cf2aca7af9550742f855d4eb69; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT "PK_7cf2aca7af9550742f855d4eb69" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: app_settings PK_app_settings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_settings
    ADD CONSTRAINT "PK_app_settings" PRIMARY KEY (id);


--
-- Name: pager_tokens PK_pager_tokens; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pager_tokens
    ADD CONSTRAINT "PK_pager_tokens" PRIMARY KEY (id);


--
-- Name: tables UQ_0fc85221960b588e27d825c4abd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tables
    ADD CONSTRAINT "UQ_0fc85221960b588e27d825c4abd" UNIQUE ("qrToken");


--
-- Name: users UQ_fe0bb3f6520ee0469504521e710; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE (username);


--
-- Name: IDX_1f4b9818a08b822a31493fdee9; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1f4b9818a08b822a31493fdee9" ON public.orders USING btree ("createdAt");


--
-- Name: IDX_2a7fdd7af437285a3ef0fc8b64; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2a7fdd7af437285a3ef0fc8b64" ON public.orders USING btree ("tableId");


--
-- Name: IDX_33c02ffdcef9fbca050414f71b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_33c02ffdcef9fbca050414f71b" ON public.orders USING btree ("tableToken");


--
-- Name: IDX_7618ff18516cbf928b15dc337b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7618ff18516cbf928b15dc337b" ON public.checkout_sessions USING btree ("expiresAt");


--
-- Name: IDX_a0ce9094eaceeaeb21c328cfc8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a0ce9094eaceeaeb21c328cfc8" ON public.checkout_sessions USING btree ("tableToken");


--
-- Name: IDX_ff56834e735fa78a15d0cf2192; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_ff56834e735fa78a15d0cf2192" ON public.products USING btree ("categoryId");


--
-- Name: IDX_orders_pager_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_orders_pager_id" ON public.orders USING btree ("pagerId");


--
-- Name: IDX_pager_tokens_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_pager_tokens_number" ON public.pager_tokens USING btree (number);


--
-- Name: IDX_pager_tokens_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_pager_tokens_order_id" ON public.pager_tokens USING btree ("orderId");


--
-- Name: IDX_pager_tokens_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_pager_tokens_status" ON public.pager_tokens USING btree (status);


--
-- Name: UQ_pager_tokens_active_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UQ_pager_tokens_active_number" ON public.pager_tokens USING btree (number) WHERE (status <> 'COMPLETED'::public.pager_tokens_status_enum);


--
-- Name: orders FK_2a7fdd7af437285a3ef0fc8b64f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_2a7fdd7af437285a3ef0fc8b64f" FOREIGN KEY ("tableId") REFERENCES public.tables(id);


--
-- Name: order_items FK_cdb99c05982d5191ac8465ac010; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_cdb99c05982d5191ac8465ac010" FOREIGN KEY ("productId") REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: order_items FK_f1d359a55923bb45b057fbdab0d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: products FK_ff56834e735fa78a15d0cf21926; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES public.categories(id);


--
-- Name: orders FK_orders_pager; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "FK_orders_pager" FOREIGN KEY ("pagerId") REFERENCES public.pager_tokens(id) ON DELETE SET NULL;


--
-- Name: pager_tokens FK_pager_tokens_order; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pager_tokens
    ADD CONSTRAINT "FK_pager_tokens_order" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict vZcjRjYNyl9EEH0uVWjuoc8LKMUhqI4TB1X1le48fuXZszaFj3yK3I9oTKA7RIS

