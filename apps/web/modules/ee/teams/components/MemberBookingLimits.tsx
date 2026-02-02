import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { SingleValue } from "react-select";
import { useFormContext, Controller } from "react-hook-form";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { ascendingLimitKeys, intervalLimitKeyToUnit } from "@calcom/lib/intervalLimits/intervalLimit";
import type { IntervalLimit } from "@calcom/lib/intervalLimits/intervalLimitSchema";
import { Button } from "@calcom/ui/components/button";
import { Select, TextField } from "@calcom/ui/components/form";
import classNames from "@calcom/ui/classNames";

type IntervalLimitsKey = keyof IntervalLimit;

const INTERVAL_LIMIT_OPTIONS = ascendingLimitKeys.map((key) => ({
    value: key as keyof IntervalLimit,
    label: `Per ${intervalLimitKeyToUnit(key)}`,
}));

type IntervalLimitItemCustomClassNames = {
    addLimitButton?: string;
    limitText?: string;
    limitSelect?: { select?: string; innerClassNames?: { select?: string } };
    container?: string;
};

type IntervalLimitItemProps = {
    limitKey: IntervalLimitsKey;
    step: number;
    value: number;
    textFieldSuffix?: string;
    disabled?: boolean;
    selectOptions: { value: keyof IntervalLimit; label: string }[];
    hasDeleteButton?: boolean;
    onDelete: (intervalLimitsKey: IntervalLimitsKey) => void;
    onLimitChange: (intervalLimitsKey: IntervalLimitsKey, limit: number) => void;
    onIntervalSelect: (interval: SingleValue<{ value: keyof IntervalLimit; label: string }>) => void;
    customClassNames?: IntervalLimitItemCustomClassNames;
};

const IntervalLimitItem = ({
    limitKey,
    step,
    value,
    textFieldSuffix,
    selectOptions,
    hasDeleteButton,
    disabled,
    onDelete,
    onLimitChange,
    onIntervalSelect,
    customClassNames,
}: IntervalLimitItemProps) => {
    return (
        <div
            data-testid="add-limit"
            className={classNames(
                "mb-4 flex w-full min-w-0 items-center gap-x-2 text-sm rtl:space-x-reverse",
                customClassNames?.container
            )}
            key={limitKey}>
            <TextField
                required
                type="number"
                containerClassName={textFieldSuffix ? "w-32 sm:w-44 -mb-1 shrink" : "w-14 sm:w-16 mb-0 shrink"}
                className={classNames("mb-0", customClassNames?.limitText)}
                placeholder={`${value}`}
                disabled={disabled}
                min={step}
                step={step}
                defaultValue={value}
                addOnSuffix={textFieldSuffix}
                onChange={(e) => onLimitChange(limitKey, parseInt(e.target.value || "0", 10))}
            />
            <Select
                options={selectOptions}
                isSearchable={false}
                isDisabled={disabled}
                defaultValue={INTERVAL_LIMIT_OPTIONS.find((option) => option.value === limitKey)}
                onChange={onIntervalSelect}
                className={classNames("w-36", customClassNames?.limitSelect?.select)}
                innerClassNames={customClassNames?.limitSelect?.innerClassNames}
            />
            {hasDeleteButton && !disabled && (
                <Button
                    variant="icon"
                    StartIcon="trash-2"
                    color="destructive"
                    className={classNames("border-none", customClassNames?.addLimitButton)}
                    onClick={() => onDelete(limitKey)}
                />
            )}
        </div>
    );
};

type MemberBookingLimitsProps = {
    disabled?: boolean;
};

export const MemberBookingLimits = ({ disabled }: MemberBookingLimitsProps) => {
    const { watch, setValue, control } = useFormContext();
    const watchIntervalLimits = watch("bookingLimits") as IntervalLimit;
    const { t } = useLocale();

    const [animateRef] = useAutoAnimate<HTMLUListElement>();

    const propertyName = "bookingLimits";
    const defaultLimit = 1;
    const step = 1;

    const addLimit = () => {
        if (!watchIntervalLimits) {
            setValue(propertyName, { PER_DAY: defaultLimit }, { shouldDirty: true });
            return;
        }
        const currentKeys = Object.keys(watchIntervalLimits);

        const [rest] = Object.values(INTERVAL_LIMIT_OPTIONS).filter(
            (option) => !currentKeys.includes(option.value)
        );
        if (!rest) return; // All limits used

        setValue(
            propertyName,
            {
                ...watchIntervalLimits,
                [rest.value]: defaultLimit,
            },
            { shouldDirty: true }
        );
    };

    return (
        <Controller
            name={propertyName}
            control={control}
            render={({ field: { onChange } }) => {
                const currentIntervalLimits = watchIntervalLimits; // Use watched value to drive UI

                return (
                    <div className="border-subtle rounded-lg border p-4">
                        <h3 className="text-emphasis mb-2 text-sm font-semibold">{t("booking_limits")}</h3>
                        <p className="text-subtle mb-4 text-sm">{t("limit_booking_frequency_description")}</p>

                        <ul ref={animateRef}>
                            {currentIntervalLimits &&
                                Object.entries(currentIntervalLimits)
                                    .sort(([limitKeyA], [limitKeyB]) => {
                                        return (
                                            ascendingLimitKeys.indexOf(limitKeyA as IntervalLimitsKey) -
                                            ascendingLimitKeys.indexOf(limitKeyB as IntervalLimitsKey)
                                        );
                                    })
                                    .map(([key, value]) => {
                                        const limitKey = key as IntervalLimitsKey;
                                        return (
                                            <IntervalLimitItem
                                                key={key}
                                                limitKey={limitKey}
                                                step={step}
                                                value={value as number}
                                                disabled={disabled}
                                                hasDeleteButton={Object.keys(currentIntervalLimits).length >= 1}
                                                selectOptions={INTERVAL_LIMIT_OPTIONS.filter(
                                                    (option) => !Object.keys(currentIntervalLimits).includes(option.value) || option.value === limitKey
                                                )}
                                                onLimitChange={(intervalLimitKey, val) =>
                                                    setValue(`${propertyName}.${intervalLimitKey}`, val, { shouldDirty: true })
                                                }
                                                onDelete={(intervalLimitKey) => {
                                                    const current = { ...currentIntervalLimits };
                                                    delete current[intervalLimitKey];
                                                    onChange(current);
                                                }}
                                                onIntervalSelect={(interval) => {
                                                    const current = { ...currentIntervalLimits };
                                                    const currentValue = watchIntervalLimits[limitKey];

                                                    delete current[limitKey];
                                                    const newData = {
                                                        ...current,
                                                        [interval?.value as IntervalLimitsKey]: currentValue,
                                                    };
                                                    onChange(newData);
                                                }}
                                            />
                                        );
                                    })}
                            {(!currentIntervalLimits || Object.keys(currentIntervalLimits).length < 4) && !disabled && (
                                <Button color="secondary" StartIcon="plus" onClick={addLimit}>
                                    {t("add_limit")}
                                </Button>
                            )}
                        </ul>
                    </div>
                );
            }}
        />
    );
};
