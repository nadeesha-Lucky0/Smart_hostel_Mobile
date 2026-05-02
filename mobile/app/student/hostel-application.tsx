import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Colors from '../../constants/Colors';
import api from '../../services/api';

type FormState = {
  studentRollNumber: string;
  studentName: string;
  studentEmail: string;
  nic: string;
  gender: string;
  dateOfBirth: string;
  contactNumber: string;
  permanentAddress: string;
  faculty: string;
  studentDegree: string;
  studentYear: string;
  registrationNumber: string;
  preferredHostel: string;
  studentWing: string;
  roomType: string;
  durationOfStay: string;
  hasMedicalCondition: boolean;
  medicalConditionDetails: string;
  allergies: string;
  regularMedications: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  guardianName: string;
  guardianContactNumber: string;
  medicalInfo: string;
  applicationStatus: string;
};

type TextField = Exclude<
  keyof FormState,
  'hasMedicalCondition' | 'applicationStatus'
>;

const initialForm: FormState = {
  studentRollNumber: '',
  studentName: '',
  studentEmail: '',
  nic: '',
  gender: '',
  dateOfBirth: '',
  contactNumber: '',
  permanentAddress: '',
  faculty: '',
  studentDegree: '',
  studentYear: '',
  registrationNumber: '',
  preferredHostel: '',
  studentWing: '',
  roomType: '',
  durationOfStay: '',
  hasMedicalCondition: false,
  medicalConditionDetails: '',
  allergies: '',
  regularMedications: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  guardianName: '',
  guardianContactNumber: '',
  medicalInfo: '',
  applicationStatus: 'Pending',
};

const yearOptions = [
  { label: '1st', value: '1' },
  { label: '2nd', value: '2' },
  { label: '3rd', value: '3' },
  { label: '4th', value: '4' },
];

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const roomTypeOptions = [
  { label: 'Single', value: 'single' },
  { label: 'Double', value: 'double' },
  { label: 'Triple', value: 'triple' },
];

const facultyOptions = [
  { label: 'Computing', value: 'computing' },
  { label: 'Business', value: 'business' },
  { label: 'Engineering', value: 'engineering' },
  { label: 'Humanities', value: 'humanities' },
];

const hostelOptions = [
  { label: 'Male Hostel', value: 'Male Hostel' },
  { label: 'Female Hostel', value: 'Female Hostel' },
];

const wingOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

export default function HostelApplication() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setMessage('');
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    const requiredFields: TextField[] = [
      'studentRollNumber',
      'studentName',
      'studentEmail',
      'nic',
      'gender',
      'dateOfBirth',
      'contactNumber',
      'permanentAddress',
      'faculty',
      'studentDegree',
      'studentYear',
      'registrationNumber',
      'preferredHostel',
      'studentWing',
      'roomType',
      'durationOfStay',
      'emergencyContactName',
      'emergencyContactPhone',
      'guardianName',
      'guardianContactNumber',
    ];

    requiredFields.forEach((field) => {
      if (!form[field].trim()) {
        nextErrors[field] = 'This field is required.';
      }
    });

    if (form.hasMedicalCondition) {
      (['medicalConditionDetails', 'allergies', 'regularMedications'] as TextField[]).forEach(
        (field) => {
          if (!form[field].trim()) {
            nextErrors[field] = 'This field is required.';
          }
        }
      );
    }

    if (
      form.studentEmail.trim() &&
      !/^it\d{8}@my\.sliit\.lk$/i.test(form.studentEmail.trim())
    ) {
      nextErrors.studentEmail = 'Use your SLIIT email, e.g. itxxxxxxxx@my.sliit.lk.';
    }

    if (form.contactNumber.trim() && !/^\d{10}$/.test(form.contactNumber.trim())) {
      nextErrors.contactNumber = 'Contact number must be exactly 10 digits.';
    }

    if (
      form.emergencyContactPhone.trim() &&
      !/^\d{10}$/.test(form.emergencyContactPhone.trim())
    ) {
      nextErrors.emergencyContactPhone = 'Emergency contact phone must be exactly 10 digits.';
    }

    if (
      form.guardianContactNumber.trim() &&
      !/^\d{10}$/.test(form.guardianContactNumber.trim())
    ) {
      nextErrors.guardianContactNumber = 'Guardian contact number must be exactly 10 digits.';
    }

    if (form.gender && form.studentRollNumber.trim()) {
      const expectedPrefix = form.gender === 'male' ? 'M' : 'F';
      if (!form.studentRollNumber.trim().toUpperCase().startsWith(expectedPrefix)) {
        nextErrors.studentRollNumber = `Roll number must start with ${expectedPrefix} for ${form.gender}.`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setMessageType('error');
      setMessage('Please fix the highlighted fields and try again.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const payload = {
      studentRollNumber: form.studentRollNumber.trim(),
      studentName: form.studentName.trim(),
      studentEmail: form.studentEmail.trim().toLowerCase(),
      nic: form.nic.trim(),
      gender: form.gender,
      dateOfBirth: new Date(form.dateOfBirth.trim()).toISOString(),
      contactNumber: form.contactNumber.trim(),
      permanentAddress: form.permanentAddress.trim(),
      faculty: form.faculty,
      studentDegree: form.studentDegree.trim(),
      studentYear: form.studentYear,
      registrationNumber: form.registrationNumber.trim(),
      preferredHostel: form.preferredHostel,
      studentWing: form.studentWing,
      roomType: form.roomType,
      durationOfStay: form.durationOfStay.trim(),
      hasMedicalCondition: form.hasMedicalCondition,
      medicalConditionDetails: form.hasMedicalCondition
        ? form.medicalConditionDetails.trim()
        : '',
      allergies: form.hasMedicalCondition ? form.allergies.trim() : '',
      regularMedications: form.hasMedicalCondition ? form.regularMedications.trim() : '',
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactPhone: form.emergencyContactPhone.trim(),
      guardianName: form.guardianName.trim(),
      guardianContactNumber: form.guardianContactNumber.trim(),
      medicalInfo: form.hasMedicalCondition ? form.medicalInfo.trim() : '',
      applicationStatus: 'Pending',
    };

    try {
      await api.post('/applications', payload);
      setForm(initialForm);
      setErrors({});
      setMessageType('success');
      setMessage('Hostel application submitted successfully.');
    } catch (error) {
      setMessageType('error');
      setMessage('Unable to submit the application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    label: string,
    field: TextField,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
      multiline?: boolean;
      placeholder?: string;
    }
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          options?.multiline && styles.textArea,
          errors[field] && styles.inputError,
        ]}
        value={form[field]}
        onChangeText={(value) => updateField(field, value)}
        placeholder={options?.placeholder || label}
        placeholderTextColor={Colors.textMuted}
        keyboardType={options?.keyboardType || 'default'}
        autoCapitalize={options?.autoCapitalize || 'sentences'}
        multiline={options?.multiline}
        textAlignVertical={options?.multiline ? 'top' : 'center'}
      />
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );

  const renderOptions = (
    label: string,
    field: TextField,
    options: Array<{ label: string; value: string }>
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const isSelected = form[field] === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
              onPress={() => updateField(field, option.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Hostel Application</Text>
        <Text style={styles.subtitle}>Complete your student accommodation request.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Details</Text>
        {renderInput('Student Roll Number', 'studentRollNumber', {
          autoCapitalize: 'characters',
          placeholder: 'M100',
        })}
        {renderInput('Full Name', 'studentName', { autoCapitalize: 'words' })}
        {renderInput('Email', 'studentEmail', {
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          placeholder: 'it55112233@my.sliit.lk',
        })}
        {renderInput('NIC', 'nic', { autoCapitalize: 'characters' })}
        {renderOptions('Gender', 'gender', genderOptions)}
        {renderInput('Date of Birth', 'dateOfBirth', {
          placeholder: 'YYYY-MM-DD',
        })}
        {renderInput('Contact Number', 'contactNumber', { keyboardType: 'phone-pad' })}
        {renderInput('Permanent Address', 'permanentAddress', { multiline: true })}
        {renderOptions('Faculty', 'faculty', facultyOptions)}
        {renderInput('Degree Program', 'studentDegree', {
          autoCapitalize: 'characters',
          placeholder: 'SE',
        })}
        {renderOptions('Year', 'studentYear', yearOptions)}
        {renderInput('Registration Number', 'registrationNumber', {
          autoCapitalize: 'characters',
          placeholder: 'IT55112233',
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hostel Preferences</Text>
        {renderOptions('Preferred Hostel', 'preferredHostel', hostelOptions)}
        {renderOptions('Student Wing', 'studentWing', wingOptions)}
        {renderOptions('Room Type', 'roomType', roomTypeOptions)}
        {renderInput('Duration of Stay', 'durationOfStay', {
          placeholder: '5 months',
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency and Guardian Details</Text>
        {renderInput('Emergency Contact Name', 'emergencyContactName', {
          autoCapitalize: 'words',
        })}
        {renderInput('Emergency Contact Phone', 'emergencyContactPhone', {
          keyboardType: 'phone-pad',
        })}
        {renderInput('Guardian Name', 'guardianName', { autoCapitalize: 'words' })}
        {renderInput('Guardian Contact Number', 'guardianContactNumber', {
          keyboardType: 'phone-pad',
        })}
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.label}>Has Medical Condition</Text>
            <Text style={styles.helperText}>Add health information needed by hostel staff.</Text>
          </View>
          <Switch
            value={form.hasMedicalCondition}
            onValueChange={(value) => updateField('hasMedicalCondition', value)}
            trackColor={{ false: Colors.border, true: '#BFDBFE' }}
            thumbColor={form.hasMedicalCondition ? Colors.roles.student : '#F3F4F6'}
          />
        </View>

        {form.hasMedicalCondition ? (
          <View style={styles.medicalFields}>
            {renderInput('Medical Condition Details', 'medicalConditionDetails', {
              multiline: true,
            })}
            {renderInput('Allergies', 'allergies', { multiline: true })}
            {renderInput('Regular Medications', 'regularMedications', { multiline: true })}
            {renderInput('Medical Info', 'medicalInfo', { multiline: true })}
          </View>
        ) : null}
      </View>

      {message ? (
        <Text style={[styles.message, messageType === 'success' ? styles.success : styles.error]}>
          {message}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.85}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    paddingTop: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 6,
  },
  section: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.text,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    minWidth: 82,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  optionButtonSelected: {
    backgroundColor: Colors.roles.student,
    borderColor: Colors.roles.student,
  },
  optionText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  switchCopy: {
    flex: 1,
  },
  helperText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  medicalFields: {
    marginTop: 18,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
  message: {
    borderRadius: 8,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    padding: 12,
  },
  success: {
    backgroundColor: '#D1FAE5',
    color: '#047857',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.roles.student,
    borderRadius: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
