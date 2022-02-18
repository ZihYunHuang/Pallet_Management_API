-- CreateTable
CREATE TABLE "account" (
    "account_number" CHAR(5) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "password" VARCHAR(300) NOT NULL DEFAULT E'',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("account_number")
);

-- CreateTable
CREATE TABLE "authority" (
    "account_number" CHAR(5) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "program_id" CHAR(5) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("account_number","program_id")
);

-- CreateTable
CREATE TABLE "discard" (
    "discard_id" CHAR(11) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "discard_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "reason" VARCHAR(50) NOT NULL DEFAULT false,
    "remark" VARCHAR(50) NOT NULL DEFAULT false,
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("discard_id")
);

-- CreateTable
CREATE TABLE "discard_detail" (
    "discard_id" CHAR(11) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "pallet_id" CHAR(5) NOT NULL DEFAULT E'',
    "type" CHAR(1) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("discard_id","pallet_id","type")
);

-- CreateTable
CREATE TABLE "pallet" (
    "pallet_id" CHAR(5) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "type" CHAR(1) NOT NULL DEFAULT E'',
    "discard_status" BOOLEAN NOT NULL DEFAULT false,
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("pallet_id","type")
);

-- CreateTable
CREATE TABLE "pallet_return" (
    "return_id" CHAR(11) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "return_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "source_warehouse_id" CHAR(9) NOT NULL DEFAULT E'',
    "destination_warehouse_id" CHAR(9) NOT NULL DEFAULT E'',
    "remark" VARCHAR(200) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("return_id")
);

-- CreateTable
CREATE TABLE "pallet_return_detail" (
    "return_id" CHAR(11) NOT NULL DEFAULT E'',
    "type" CHAR(1) NOT NULL DEFAULT E'',
    "pallet_id" CHAR(5) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "remark" VARCHAR(200) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("return_id","type","pallet_id")
);

-- CreateTable
CREATE TABLE "profile" (
    "account_number" CHAR(5) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "user_name" VARCHAR(20) NOT NULL DEFAULT E'',
    "email" VARCHAR(50) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("account_number")
);

-- CreateTable
CREATE TABLE "programs" (
    "program_id" CHAR(5) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "program_name" VARCHAR(50) NOT NULL DEFAULT E'',
    "sub_chidren" BOOLEAN NOT NULL DEFAULT false,
    "parent_prog_id" CHAR(5) NOT NULL DEFAULT E'',
    "app_url" VARCHAR(50) NOT NULL DEFAULT E'',
    "toolip" VARCHAR(100) NOT NULL DEFAULT E'',
    "app_icon" VARCHAR(100) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("program_id")
);

-- CreateTable
CREATE TABLE "sallet_lend" (
    "lend_id" CHAR(11) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "lend_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "order_number" VARCHAR(50) NOT NULL DEFAULT E'',
    "source_warehouse_id" CHAR(9) NOT NULL DEFAULT E'',
    "destination_warehouse_id" CHAR(9) NOT NULL DEFAULT E'',
    "remark" VARCHAR(200) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("lend_id")
);

-- CreateTable
CREATE TABLE "sallet_lend_detail" (
    "lend_id" CHAR(11) NOT NULL DEFAULT E'',
    "type" CHAR(1) NOT NULL DEFAULT E'',
    "pallet_id" CHAR(5) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "remark" VARCHAR(200) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("lend_id","type","pallet_id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "warehouse_id" CHAR(9) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "warehouse_name" VARCHAR(50) NOT NULL DEFAULT E'',
    "telephone" VARCHAR(15) NOT NULL DEFAULT E'',
    "pallet_base" INTEGER NOT NULL,
    "remark" VARCHAR(200) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("warehouse_id")
);

-- CreateTable
CREATE TABLE "supplier_pallet_detail" (
    "warehouse_id" CHAR(9) NOT NULL DEFAULT E'',
    "pallet_id" CHAR(5) NOT NULL DEFAULT E'',
    "type" CHAR(1) NOT NULL DEFAULT E'',
    "flag" CHAR(1) NOT NULL DEFAULT E'',
    "creation_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "creation_time" TIME(6) NOT NULL DEFAULT CURRENT_TIME,
    "creator_user" CHAR(5) NOT NULL DEFAULT E'',
    "modified_date" DATE,
    "modified_time" TIME(6),
    "modifier_user" CHAR(5) NOT NULL DEFAULT E'',

    PRIMARY KEY ("warehouse_id","pallet_id")
);

-- AddForeignKey
ALTER TABLE "account" ADD FOREIGN KEY ("account_number") REFERENCES "profile"("account_number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authority" ADD FOREIGN KEY ("account_number") REFERENCES "profile"("account_number") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authority" ADD FOREIGN KEY ("program_id") REFERENCES "programs"("program_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discard_detail" ADD FOREIGN KEY ("discard_id") REFERENCES "discard"("discard_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discard_detail" ADD FOREIGN KEY ("pallet_id", "type") REFERENCES "pallet"("pallet_id", "type") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pallet_return" ADD FOREIGN KEY ("destination_warehouse_id") REFERENCES "supplier"("warehouse_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pallet_return" ADD FOREIGN KEY ("source_warehouse_id") REFERENCES "supplier"("warehouse_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pallet_return_detail" ADD FOREIGN KEY ("return_id") REFERENCES "pallet_return"("return_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pallet_return_detail" ADD FOREIGN KEY ("type", "pallet_id") REFERENCES "pallet"("type", "pallet_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sallet_lend" ADD FOREIGN KEY ("destination_warehouse_id") REFERENCES "supplier"("warehouse_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sallet_lend" ADD FOREIGN KEY ("source_warehouse_id") REFERENCES "supplier"("warehouse_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sallet_lend_detail" ADD FOREIGN KEY ("lend_id") REFERENCES "sallet_lend"("lend_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sallet_lend_detail" ADD FOREIGN KEY ("type", "pallet_id") REFERENCES "pallet"("type", "pallet_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_pallet_detail" ADD FOREIGN KEY ("pallet_id", "type") REFERENCES "pallet"("pallet_id", "type") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_pallet_detail" ADD FOREIGN KEY ("warehouse_id") REFERENCES "supplier"("warehouse_id") ON DELETE CASCADE ON UPDATE CASCADE;
