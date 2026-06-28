export declare const aiAnalysis: import("drizzle-orm/mysql-core").MySqlTableWithColumns<{
    name: "ai_analysis";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "id";
            tableName: "ai_analysis";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        patentId: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "patent_id";
            tableName: "ai_analysis";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        analysisType: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "analysis_type";
            tableName: "ai_analysis";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        result: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "result";
            tableName: "ai_analysis";
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
        confidence: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "confidence";
            tableName: "ai_analysis";
            dataType: "string";
            columnType: "MySqlDecimal";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "created_at";
            tableName: "ai_analysis";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
            driverParam: string | number;
            notNull: false;
            hasDefault: true;
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
export declare const insertAIAnalysisSchema: import("zod").ZodObject<Omit<{
    id: import("zod").ZodOptional<import("zod").ZodString>;
    patentId: import("zod").ZodString;
    analysisType: import("zod").ZodString;
    result: import("zod").ZodType<import("drizzle-zod").Json, import("zod").ZodTypeDef, import("drizzle-zod").Json>;
    confidence: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodString>>;
    createdAt: import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodDate>>;
}, "id" | "createdAt">, "strip", import("zod").ZodTypeAny, {
    patentId: string;
    analysisType: string;
    result: import("drizzle-zod").Json;
    confidence?: string | null | undefined;
}, {
    patentId: string;
    analysisType: string;
    result: import("drizzle-zod").Json;
    confidence?: string | null | undefined;
}>;
//# sourceMappingURL=ai-analysis.model.d.ts.map