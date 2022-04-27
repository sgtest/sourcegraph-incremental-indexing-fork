import React from 'react'

import { Button, Checkbox } from '@sourcegraph/wildcard'

import { SurveyRatingRadio } from './SurveyRatingRadio'
import { Toast } from './Toast'

import styles from './Step.module.scss'

export interface UserRatingFormProps {
    onChange?: (score: number) => void
    toggleErrorMessage: boolean
    handleContinue: () => void
    handleDismiss: () => void
    shouldPermanentlyDismiss: boolean
    toggleShouldPermanentlyDismiss: (value: boolean) => void
}

const UserRatingForm: React.FunctionComponent<UserRatingFormProps> = ({
    onChange,
    toggleErrorMessage,
    handleDismiss,
    handleContinue,
    shouldPermanentlyDismiss,
    toggleShouldPermanentlyDismiss,
}) => (
    <Toast
        title="Tell us what you think"
        subtitle={
            <span id="survey-toast-scores">How likely is it that you would recommend Sourcegraph to a friend?</span>
        }
        cta={
            <>
                <SurveyRatingRadio ariaLabelledby="survey-form-scores" onChange={onChange} />
                {toggleErrorMessage && <div>Please select a score between 0 to 10</div>}
            </>
        }
        footer={
            <div className={styles.footerButton}>
                <Checkbox
                    id="survey-toast-refuse"
                    label="Don't show this again"
                    checked={shouldPermanentlyDismiss}
                    onChange={event => toggleShouldPermanentlyDismiss(event.target.checked)}
                />
                <Button id="survey-toast-dismiss" variant="secondary" size="sm" onClick={handleContinue}>
                    Continue
                </Button>
            </div>
        }
        onDismiss={handleDismiss}
    />
)

export { UserRatingForm }
