export const mapZodErrors = (error) => {
    const fieldErrors = {};

    error.issues.forEach((issue) => {
        const pathKey = issue.path.length > 0 ? issue.path.join('.') : 'form';
        if (!fieldErrors[pathKey]) {
            fieldErrors[pathKey] = issue.message;
        }
    });

    return fieldErrors;
};

export const validateWithSchema = (schema, data) => {
    const result = schema.safeParse(data);
    if (result.success) {
        return {
            success: true,
            data: result.data,
            errors: {}
        };
    }

    return {
        success: false,
        data: null,
        errors: mapZodErrors(result.error)
    };
};
