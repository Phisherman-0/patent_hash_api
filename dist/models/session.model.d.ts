export declare const sessions: import("drizzle-orm/mysql-core").MySqlTableWithColumns<{
    name: "sessions";
    schema: undefined;
    columns: {
        sid: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "sid";
            tableName: "sessions";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        sess: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "sess";
            tableName: "sessions";
            dataType: "json";
            columnType: "MySqlJson";
            data: unknown;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        expire: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "expire";
            tableName: "sessions";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "mysql";
}>;
//# sourceMappingURL=session.model.d.ts.map