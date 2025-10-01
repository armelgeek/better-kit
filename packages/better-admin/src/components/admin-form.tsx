import * as React from "react";
import { useForm, Controller, type FieldValues, type UseFormReturn } from "react-hook-form";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

export interface FormField {
	name: string;
	label: string;
	type: "text" | "email" | "password" | "number" | "textarea" | "select" | "date" | "datetime-local";
	placeholder?: string;
	required?: boolean;
	defaultValue?: any;
	options?: Array<{ label: string; value: string | number }>;
	validation?: {
		required?: string;
		pattern?: { value: RegExp; message: string };
		min?: { value: number; message: string };
		max?: { value: number; message: string };
		minLength?: { value: number; message: string };
		maxLength?: { value: number; message: string };
	};
}

export interface AdminFormProps<T extends FieldValues = FieldValues> {
	fields: FormField[];
	onSubmit: (data: T) => void | Promise<void>;
	onCancel?: () => void;
	defaultValues?: Partial<T>;
	title?: string;
	submitLabel?: string;
	cancelLabel?: string;
	loading?: boolean;
}

export function AdminForm<T extends FieldValues = FieldValues>({
	fields,
	onSubmit,
	onCancel,
	defaultValues,
	title,
	submitLabel = "Submit",
	cancelLabel = "Cancel",
	loading = false,
}: AdminFormProps<T>) {
	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<T>({
		defaultValues: defaultValues as any,
	});

	const renderField = (field: FormField) => {
		const error = errors[field.name];
		const errorMessage = error?.message as string | undefined;

		return (
			<div key={field.name} className="space-y-2">
				<Label htmlFor={field.name}>
					{field.label}
					{field.required && <span className="text-red-500 ml-1">*</span>}
				</Label>
				<Controller
					name={field.name as any}
					control={control}
					rules={{
						required: field.required ? field.validation?.required || `${field.label} is required` : false,
						...field.validation,
					}}
					render={({ field: formField }) => {
						if (field.type === "textarea") {
							return (
								<Textarea
									{...formField}
									id={field.name}
									placeholder={field.placeholder}
									disabled={loading}
								/>
							);
						}

						if (field.type === "select" && field.options) {
							return (
								<Select
									{...formField}
									id={field.name}
									disabled={loading}
								>
									<option value="">Select {field.label}</option>
									{field.options.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</Select>
							);
						}

						return (
							<Input
								{...formField}
								id={field.name}
								type={field.type}
								placeholder={field.placeholder}
								disabled={loading}
							/>
						);
					}}
				/>
				{errorMessage && (
					<p className="text-sm text-red-600">{errorMessage}</p>
				)}
			</div>
		);
	};

	return (
		<Card>
			{title && (
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
			)}
			<form onSubmit={handleSubmit(onSubmit)}>
				<CardContent className="space-y-4">
					{fields.map((field) => renderField(field))}
				</CardContent>
				<CardFooter className="flex justify-end space-x-2">
					{onCancel && (
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
							disabled={loading}
						>
							{cancelLabel}
						</Button>
					)}
					<Button type="submit" disabled={loading}>
						{loading ? "Loading..." : submitLabel}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}

// Export hook for advanced usage
export type { UseFormReturn };
export { useForm, Controller };
