import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  ArrowRight,
  LogOut,
  ChevronRight,
  User,
  BookOpen,
  Home,
  ShieldAlert,
  Edit,
  Save,
  CreditCard,
  Layers,
  Layout,
  Stethoscope,
  Trash2,
  AlertCircle
} from 'lucide-react-native';
import api from '../../services/api';
import * as DocumentPicker from 'expo-document-picker';

type TabType = 'apply' | 'clearance';

// Form Types & Options
type ApplicationFormState = {
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
  medicalReportUrl: string;
};

const initialAppForm: ApplicationFormState = {
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
  medicalReportUrl: '',
};

type ClearanceFormState = {
  studentId: string;
  studentName: string;
  email: string;
  roomNumber: string;
  bankName: string;
  branchName: string;
  accountHolderName: string;
  accountNumber: string;
};

const initialClearanceForm: ClearanceFormState = {
  studentId: '',
  studentName: '',
  email: '',
  roomNumber: '',
  bankName: '',
  branchName: '',
  accountHolderName: '',
  accountNumber: '',
};

const yearOptions = [
  { label: '1st Year', value: '1' },
  { label: '2nd Year', value: '2' },
  { label: '3rd Year', value: '3' },
  { label: '4th Year', value: '4' },
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

export default function StudentApplications() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('apply');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingMedical, setUploadingMedical] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingClearance, setIsEditingClearance] = useState(false);

  // App Form State
  const [appForm, setAppForm] = useState<ApplicationFormState>({
    ...initialAppForm,
    registrationNumber: user?.studentId || '',
    studentName: user?.name || '',
    studentEmail: user?.email || ''
  });
  const [appErrors, setAppErrors] = useState<Partial<Record<keyof ApplicationFormState, string>>>({});
  const [existingApp, setExistingApp] = useState<any>(null);
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  // Clearance Form State
  const [clearanceForm, setClearanceForm] = useState<ClearanceFormState>({ ...initialClearanceForm, studentName: user?.name || '', email: user?.email || '' });
  const [myAllocation, setMyAllocation] = useState<any>(null);
  const [existingClearance, setExistingClearance] = useState<any>(null);

  // -------------------------------------------------------------
  // DATA FETCHING
  // -------------------------------------------------------------
  const fetchData = async () => {
    try {
      setIsLoadingApp(true);
      
      // Fetch Application
      try {
        const appRes = await api.get('/applications/me');
        if (appRes.data && !appRes.data.error) {
          setExistingApp(appRes.data);
          const data = appRes.data;
          setAppForm({
            ...initialAppForm,
            ...data,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0].replace(/-/g, '/') : ''
          });
          setIsEditing(false);
        }
      } catch (e) {}

      // Fetch Allocation
      try {
        const allocRes = await api.get('/allocations/me');
        if (allocRes.data?.success) setMyAllocation(allocRes.data.data);
      } catch (e) {}

      // Fetch Clearance
      try {
        const clearRes = await api.get('/clearance/me');
        if (clearRes.data?.success) {
          setExistingClearance(clearRes.data.data);
          const c = clearRes.data.data;
          setClearanceForm({
            studentId: c.studentRollNumber || '',
            studentName: c.studentName || '',
            email: c.studentEmail || '',
            roomNumber: c.roomNumber || '',
            bankName: c.bankDetails?.bankName || '',
            branchName: c.bankDetails?.branchName || '',
            accountHolderName: c.bankDetails?.accountHolderName || '',
            accountNumber: c.bankDetails?.accountNumber || '',
          });
          setIsEditingClearance(false);
        } else {
          setExistingClearance(null);
          setClearanceForm({ ...initialClearanceForm, studentName: user?.name || '', email: user?.email || '' });
        }
      } catch (e) {
        setExistingClearance(null);
        setClearanceForm({ ...initialClearanceForm, studentName: user?.name || '', email: user?.email || '' });
      }
    } catch (err: any) {
      console.error('Data fetch error:', err);
    } finally {
      setIsLoadingApp(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------
  // APPLICATION LOGIC
  // -------------------------------------------------------------
  const updateAppField = <K extends keyof ApplicationFormState>(field: K, value: ApplicationFormState[K]) => {
    if (existingApp && !isEditing) return;
    setAppForm(current => {
      let newValue = value;
      if (field === 'dateOfBirth' && typeof newValue === 'string') {
        const prevValue = (current as any)[field] || '';
        const isDeleting = newValue.length < prevValue.length;
        if (!isDeleting) {
          let cleaned = newValue.replace(/\D/g, '');
          if (cleaned.length >= 4) cleaned = cleaned.slice(0, 4) + '/' + cleaned.slice(4);
          if (cleaned.length >= 7) cleaned = cleaned.slice(0, 7) + '/' + cleaned.slice(7);
          newValue = cleaned.slice(0, 10) as any;
        }
      }
      const next = { ...current, [field]: newValue };
      if (field === 'gender') {
        if (newValue === 'male') { next.preferredHostel = 'Male Hostel'; next.studentWing = 'male'; }
        else if (newValue === 'female') { next.preferredHostel = 'Female Hostel'; next.studentWing = 'female'; }
      }
      return next;
    });
    setAppErrors(current => ({ ...current, [field]: undefined }));
  };

  const submitApplication = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...appForm,
        registrationNumber: appForm.registrationNumber.toUpperCase(),
        dateOfBirth: appForm.dateOfBirth ? new Date(appForm.dateOfBirth.replace(/\//g, '-')).toISOString() : new Date().toISOString(),
      };
      if (existingApp) await api.put('/applications/me', payload);
      else await api.post('/applications', payload);
      Alert.alert('Success', 'Application submitted successfully.');
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to submit.');
    } finally { setIsSubmitting(false); }
  };

  const handleMedicalUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled || !result.assets) return;
      setUploadingMedical(true);
      const formData = new FormData();
      formData.append('medicalReport', { uri: result.assets[0].uri, name: result.assets[0].name, type: result.assets[0].mimeType || 'application/octet-stream' } as any);
      const res = await api.post('/applications/upload-medical', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data?.url) updateAppField('medicalReportUrl', res.data.url);
    } catch (e) { Alert.alert('Error', 'Upload failed.'); } finally { setUploadingMedical(false); }
  };

  // -------------------------------------------------------------
  // CLEARANCE LOGIC
  // -------------------------------------------------------------
  const updateClearanceField = <K extends keyof ClearanceFormState>(field: K, value: ClearanceFormState[K]) => {
    setClearanceForm(current => ({ ...current, [field]: value }));
  };

  const submitClearance = async () => {
    if (!myAllocation && !existingApp) {
        Alert.alert('Error', 'You need an active hostel allocation to submit a clearance form.');
        return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        studentRollNumber: myAllocation?.studentRollNumber || existingApp?.studentRollNumber || '',
        studentName: myAllocation?.studentName || existingApp?.studentName || user?.name || '',
        studentEmail: user?.email || '',
        studentPhone: existingApp?.contactNumber || '',
        wing: myAllocation?.studentWing || existingApp?.studentWing || '',
        floorNumber: Number(myAllocation?.floorNumber || 0),
        roomType: myAllocation?.roomType || existingApp?.roomType || '',
        roomNumber: Number(myAllocation?.roomnumber || 0),
        bedId: myAllocation?.bedId || 'N/A',
        bankDetails: {
          bankName: clearanceForm.bankName,
          branchName: clearanceForm.branchName,
          accountHolderName: clearanceForm.accountHolderName,
          accountNumber: clearanceForm.accountNumber,
        },
      };
      await api.post('/clearance', payload);
      Alert.alert('Success', 'Clearance form submitted.');
      fetchData();
    } catch (e) { Alert.alert('Error', 'Failed to submit clearance.'); } finally { setIsSubmitting(false); }
  };

  const updateClearanceBankDetails = async () => {
    try {
        setIsSubmitting(true);
        await api.patch('/clearance/me/bank', {
            bankName: clearanceForm.bankName,
            branchName: clearanceForm.branchName,
            accountHolderName: clearanceForm.accountHolderName,
            accountNumber: clearanceForm.accountNumber,
        });
        Alert.alert('Success', 'Bank details updated successfully.');
        setIsEditingClearance(false);
        fetchData();
    } catch (e) {
        Alert.alert('Error', 'Failed to update bank details.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const deleteClearanceRequest = () => {
    Alert.alert(
        'Delete Clearance',
        'Are you sure you want to delete this clearance request? You will need to submit a new one.',
        [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        setIsSubmitting(true);
                        await api.delete('/clearance/me');
                        Alert.alert('Success', 'Clearance request deleted.');
                        fetchData();
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete clearance request.');
                    } finally {
                        setIsSubmitting(false);
                    }
                }
            }
        ]
    );
  };

  // -------------------------------------------------------------
  // RENDER HELPERS
  // -------------------------------------------------------------
  const renderInput = (label: string, value: string, onChange: (val: string) => void, props?: any) => {
    const isViewOnly = props?.editable === false || (activeTab === 'apply' && existingApp && !isEditing) || (activeTab === 'clearance' && existingClearance && !isEditingClearance);
    return (
      <View style={[styles.inputGroup, props?.fullWidth ? { width: '100%' } : { width: '48%' }]}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[styles.input, isViewOnly && styles.viewOnlyInput, props?.style]}
          value={value}
          onChangeText={onChange}
          placeholderTextColor="#94a3b8"
          editable={!isViewOnly}
          {...props}
        />
      </View>
    );
  };

  const renderOptions = (label: string, field: keyof ApplicationFormState, options: any[]) => {
    const isViewOnly = activeTab === 'apply' && existingApp && !isEditing;
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.optionsRow}>
          {options.map(opt => {
            const isSelected = appForm[field] === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.optionBtn, isSelected && styles.optionBtnActive, isViewOnly && !isSelected && { opacity: 0.5 }]}
                onPress={() => updateAppField(field, opt.value)}
                disabled={isViewOnly}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity style={[styles.tab, activeTab === 'apply' && styles.tabActive]} onPress={() => setActiveTab('apply')}>
            <Plus size={16} color={activeTab === 'apply' ? '#FFF' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'apply' && styles.tabTextActive]}>Registration</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'clearance' && styles.tabActive]} onPress={() => setActiveTab('clearance')}>
            <LogOut size={16} color={activeTab === 'clearance' ? '#FFF' : '#64748b'} />
            <Text style={[styles.tabText, activeTab === 'clearance' && styles.tabTextActive]}>Clearance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoadingApp ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={Colors.roles.student} /></View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

            {activeTab === 'apply' ? (
              <View style={styles.formContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Hostel Application</Text>
                  <Text style={styles.subtitle}>{existingApp ? 'Your submitted application' : 'Complete your accommodation request'}</Text>
                </View>

                {existingApp && (
                  <View style={[styles.statusBanner, { borderLeftColor: getStatusColor(existingApp.applicationStatus) }]}>
                    <View style={styles.statusLeft}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(existingApp.applicationStatus) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(existingApp.applicationStatus) }]}>{existingApp.applicationStatus.toUpperCase()}</Text>
                      <Text style={styles.statusId}> • ID: {existingApp.studentRollNumber || 'PENDING'}</Text>
                    </View>
                  </View>
                )}

                {/* CONDITIONAL UI: VIEW OR FORM */}
                {existingApp && !isEditing ? (
                  /* VIEW MODE */
                  <>
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}><User size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>PERSONAL DETAILS</Text></View>
                      <View style={styles.grid}>
                        {renderInput('FULL NAME', appForm.studentName, () => {}, { fullWidth: true })}
                        {renderInput('NIC', appForm.nic, () => {})}
                        {renderInput('GENDER', appForm.gender, () => {})}
                        {renderInput('DATE OF BIRTH', appForm.dateOfBirth, () => {})}
                        {renderInput('CONTACT NUMBER', appForm.contactNumber, () => {})}
                        {renderInput('EMAIL', appForm.studentEmail, () => {}, { fullWidth: true })}
                      </View>
                    </View>

                    <View style={styles.section}>
                      <View style={styles.sectionHeader}><BookOpen size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>ACADEMIC INFORMATION</Text></View>
                      <View style={styles.grid}>
                        {renderInput('DEGREE PROGRAM', appForm.studentDegree, () => {})}
                        {renderInput('YEAR', appForm.studentYear, () => {})}
                        {renderInput('REGISTRATION NUMBER', appForm.registrationNumber, () => {})}
                        {renderInput('FACULTY', appForm.faculty, () => {})}
                      </View>
                    </View>

                    <View style={styles.section}>
                      <View style={styles.sectionHeader}><Home size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>HOSTEL PREFERENCE</Text></View>
                      <View style={styles.grid}>
                        {renderInput('ROOM TYPE', appForm.roomType, () => {})}
                        {renderInput('PREFERRED HOSTEL', appForm.preferredHostel, () => {})}
                        {renderInput('DURATION OF STAY', appForm.durationOfStay, () => {})}
                      </View>
                    </View>

                    <View style={styles.section}>
                      <View style={styles.sectionHeader}><ShieldAlert size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>GUARDIAN & EMERGENCY</Text></View>
                      <View style={styles.grid}>
                        {renderInput('GUARDIAN NAME', appForm.guardianName, () => {})}
                        {renderInput('GUARDIAN CONTACT', appForm.guardianContactNumber, () => {})}
                        {renderInput('EMERGENCY CONTACT NAME', appForm.emergencyContactName, () => {})}
                        {renderInput('EMERGENCY CONTACT PHONE', appForm.emergencyContactPhone, () => {})}
                      </View>
                    </View>

                    <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                      <Edit size={18} color="#FFF" />
                      <Text style={styles.editBtnText}>Edit Application</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* INTERACTIVE FORM MODE */
                  <>
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}><User size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>PERSONAL DETAILS</Text></View>
                      {renderInput('FULL NAME', appForm.studentName, (v) => updateAppField('studentName', v), { fullWidth: true })}
                      {renderInput('EMAIL', appForm.studentEmail, (v) => updateAppField('studentEmail', v), { fullWidth: true, editable: false })}
                      {renderInput('NIC', appForm.nic, (v) => updateAppField('nic', v), { fullWidth: true })}
                      {renderOptions('GENDER', 'gender', genderOptions)}
                      {renderInput('DATE OF BIRTH', appForm.dateOfBirth, (v) => updateAppField('dateOfBirth', v), { fullWidth: true, placeholder: 'YYYY/MM/DD' })}
                      {renderInput('CONTACT NUMBER', appForm.contactNumber, (v) => updateAppField('contactNumber', v), { fullWidth: true })}
                      {renderInput('PERMANENT ADDRESS', appForm.permanentAddress, (v) => updateAppField('permanentAddress', v), { fullWidth: true, multiline: true })}
                    </View>

                    <View style={styles.section}>
                      <View style={styles.sectionHeader}><BookOpen size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>ACADEMIC INFORMATION</Text></View>
                      {renderOptions('FACULTY', 'faculty', facultyOptions)}
                      {renderInput('DEGREE PROGRAM', appForm.studentDegree, (v) => updateAppField('studentDegree', v), { fullWidth: true })}
                      {renderOptions('YEAR', 'studentYear', yearOptions)}
                      {renderInput('REGISTRATION NUMBER', appForm.registrationNumber, (v) => updateAppField('registrationNumber', v), { fullWidth: true })}
                    </View>

                    <View style={styles.section}>
                      <View style={styles.sectionHeader}><Home size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>HOSTEL PREFERENCES</Text></View>
                      {renderOptions('ROOM TYPE', 'roomType', roomTypeOptions)}
                      {renderInput('DURATION OF STAY', appForm.durationOfStay, (v) => updateAppField('durationOfStay', v), { fullWidth: true })}
                    </View>

                    <View style={styles.section}>
                      <View style={styles.sectionHeader}><ShieldAlert size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>EMERGENCY CONTACTS</Text></View>
                      {renderInput('EMERGENCY CONTACT NAME', appForm.emergencyContactName, (v) => updateAppField('emergencyContactName', v), { fullWidth: true })}
                      {renderInput('EMERGENCY CONTACT PHONE', appForm.emergencyContactPhone, (v) => updateAppField('emergencyContactPhone', v), { fullWidth: true })}
                      {renderInput('GUARDIAN NAME', appForm.guardianName, (v) => updateAppField('guardianName', v), { fullWidth: true })}
                      {renderInput('GUARDIAN CONTACT NUMBER', appForm.guardianContactNumber, (v) => updateAppField('guardianContactNumber', v), { fullWidth: true })}
                    </View>

                    <View style={styles.section}>
                      <View style={styles.sectionHeader}><Stethoscope size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>MEDICAL INFORMATION</Text></View>
                      <View style={styles.switchRow}>
                        <View style={styles.switchCopy}>
                          <Text style={styles.label}>MEDICAL CONDITION?</Text>
                          <Text style={styles.helperText}>Required by hostel staff</Text>
                        </View>
                        <Switch
                          value={appForm.hasMedicalCondition}
                          onValueChange={(val) => updateAppField('hasMedicalCondition', val)}
                          trackColor={{ false: '#e2e8f0', true: Colors.roles.student + '80' }}
                          thumbColor={appForm.hasMedicalCondition ? Colors.roles.student : '#f4f3f4'}
                        />
                      </View>
                      {appForm.hasMedicalCondition && (
                        <View style={styles.medicalFields}>
                          {renderInput('CONDITION DETAILS', appForm.medicalConditionDetails, (v) => updateAppField('medicalConditionDetails', v), { fullWidth: true, multiline: true })}
                          {renderInput('ALLERGIES', appForm.allergies, (v) => updateAppField('allergies', v), { fullWidth: true, multiline: true })}
                          {renderInput('REGULAR MEDICATIONS', appForm.regularMedications, (v) => updateAppField('regularMedications', v), { fullWidth: true, multiline: true })}
                          <View style={styles.inputGroup}>
                            <Text style={styles.label}>MEDICAL REPORT</Text>
                            <TouchableOpacity style={styles.uploadBtn} onPress={handleMedicalUpload} disabled={uploadingMedical}>
                              <ClipboardList size={20} color={appForm.medicalReportUrl ? Colors.roles.student : '#94a3b8'} />
                              <Text style={styles.uploadBtnText}>{uploadingMedical ? 'UPLOADING...' : appForm.medicalReportUrl ? 'CHANGE DOCUMENT' : 'ATTACH DOCUMENT'}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={submitApplication} disabled={isSubmitting}>
                      {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                        <>
                          <Save size={18} color="#FFF" />
                          <Text style={styles.submitBtnText}>{existingApp ? 'UPDATE APPLICATION' : 'SUBMIT APPLICATION'}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              /* CLEARANCE TAB */
              <View style={styles.formContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Clearance Form</Text>
                  <Text style={styles.subtitle}>Please review your allocation details below and submit for clearance.</Text>
                </View>

                {existingClearance && (
                  <View style={[styles.statusBanner, { borderLeftColor: getStatusColor(existingClearance.status) }]}>
                    <View style={styles.statusLeft}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(existingClearance.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(existingClearance.status) }]}>{existingClearance.status.toUpperCase()}</Text>
                      <Text style={styles.statusId}> • SUBMITTED ON {new Date(existingClearance.submittedAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.section}>
                  <View style={styles.sectionHeader}><User size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>STUDENT DETAILS</Text></View>
                  <View style={styles.grid}>
                    {renderInput('FULL NAME', myAllocation?.studentName || existingApp?.studentName || user?.name || '', () => {}, { fullWidth: true, editable: false })}
                    {renderInput('EMAIL', user?.email || '', () => {}, { fullWidth: true, editable: false })}
                    {renderInput('PHONE', existingApp?.contactNumber || '', () => {}, { editable: false })}
                    {renderInput('ROLL NUMBER', myAllocation?.studentRollNumber || existingApp?.studentRollNumber || 'N/A', () => {}, { editable: false })}
                  </View>
                </View>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}><Layers size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>ALLOCATION INFO</Text></View>
                  <View style={styles.grid}>
                    {renderInput('WING', myAllocation?.studentWing || existingApp?.studentWing || 'N/A', () => {}, { editable: false })}
                    {renderInput('FLOOR', String(myAllocation?.floorNumber || 'N/A'), () => {}, { editable: false })}
                    {renderInput('ROOM NUMBER', myAllocation?.roomnumber ? `${myAllocation.studentWing === 'female' ? 'F' : 'M'}${myAllocation.roomnumber}` : (existingApp?.assignedRoom || 'N/A'), () => {}, { editable: false })}
                    {renderInput('ROOM TYPE', myAllocation?.roomType || existingApp?.roomType || 'N/A', () => {}, { editable: false })}
                    {renderInput('BED ID', myAllocation?.bedId || 'N/A', () => {}, { editable: false })}
                  </View>
                </View>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}><CreditCard size={16} color={Colors.roles.student} /><Text style={styles.sectionTitle}>REFUND BANK DETAILS</Text></View>
                  <Text style={styles.helperText}>Where should we send your security deposit refund?</Text>
                  <View style={styles.grid}>
                    {renderInput('ACCOUNT HOLDER NAME', clearanceForm.accountHolderName, (v) => updateClearanceField('accountHolderName', v), { fullWidth: true, placeholder: 'Enter full name as in bank' })}
                    {renderInput('BANK NAME', clearanceForm.bankName, (v) => updateClearanceField('bankName', v), { fullWidth: true, placeholder: 'e.g. Bank of Ceylon, HNB' })}
                    {renderInput('BRANCH', clearanceForm.branchName, (v) => updateClearanceField('branchName', v), { fullWidth: true, placeholder: 'Branch location' })}
                    {renderInput('ACCOUNT NUMBER', clearanceForm.accountNumber, (v) => updateClearanceField('accountNumber', v), { fullWidth: true, placeholder: 'Enter account number', keyboardType: 'number-pad' })}
                  </View>
                </View>

                {/* ACTION BUTTONS */}
                {!existingClearance ? (
                  <TouchableOpacity style={styles.submitBtn} onPress={submitClearance} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                      <>
                        <Save size={18} color="#FFF" />
                        <Text style={styles.submitBtnText}>SUBMIT CLEARANCE</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 12 }}>
                    {/* EDIT/SAVE FLOW FOR CLEARANCE */}
                    {!isEditingClearance ? (
                        <>
                            {(existingClearance.status === 'Pending' || existingClearance.status === 'In Progress') && (
                            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#4f46e5' }]} onPress={() => setIsEditingClearance(true)}>
                                <Edit size={18} color="#FFF" />
                                <Text style={styles.submitBtnText}>EDIT BANK DETAILS</Text>
                            </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#10b981' }]} onPress={updateClearanceBankDetails} disabled={isSubmitting}>
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Save size={18} color="#FFF" />
                                <Text style={styles.submitBtnText}>SAVE BANK DETAILS</Text>
                            </>
                            )}
                        </TouchableOpacity>
                    )}
                    
                    {existingClearance.status === 'Pending' && !isEditingClearance && (
                      <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#ef4444' }]} onPress={deleteClearanceRequest} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                          <>
                            <Trash2 size={18} color="#FFF" />
                            <Text style={styles.submitBtnText}>DELETE CLEARANCE REQUEST</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {(existingClearance.status === 'Approved' || existingClearance.status === 'Rejected') && (
                      <View style={[styles.statusBanner, { justifyContent: 'center', backgroundColor: '#f1f5f9', borderLeftWidth: 0 }]}>
                         <AlertCircle size={20} color="#64748b" />
                         <Text style={{ marginLeft: 10, color: '#64748b', fontWeight: '800' }}>
                            CLEARANCE {existingClearance.status.toUpperCase()} - NO FURTHER EDITS
                         </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Activated':
    case 'Approved':
    case 'Room Allocated': return '#10b981';
    case 'Pending':
    case 'In Progress': return '#f59e0b';
    case 'Rejected':
    case 'Deactivated': return '#ef4444';
    default: return '#6b7280';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  tabContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  tabWrapper: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 6, elevation: 2 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
  tabActive: { backgroundColor: Colors.roles.student },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#FFF' },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '600' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 24, padding: 16, borderRadius: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#10b981', elevation: 2 },
  statusLeft: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontWeight: '800', fontSize: 13 },
  statusId: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  formContainer: { paddingHorizontal: 24 },
  section: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: '#475569', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '900', color: '#94a3b8', marginBottom: 8, letterSpacing: 1 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 16, minHeight: 48, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  viewOnlyInput: { backgroundColor: '#f8fafc', color: '#64748b' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9' },
  optionBtnActive: { backgroundColor: Colors.roles.student },
  optionText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  optionTextActive: { color: '#FFF' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchCopy: { flex: 1 },
  helperText: { fontSize: 11, color: '#64748b', marginTop: 2 },
  medicalFields: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, minHeight: 56 },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  hintText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 12 },
  editBtn: { backgroundColor: '#4f46e5', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 4 },
  editBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  submitBtn: { backgroundColor: Colors.roles.student, borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, elevation: 4 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
