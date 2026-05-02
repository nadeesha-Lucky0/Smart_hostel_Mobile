import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ClipboardList, Home, LogOut, User } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';

type DashboardSection = 'dashboard' | 'applications' | 'clearance';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [activeSection, setActiveSection] = useState<DashboardSection>('dashboard');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [roomNumber, setRoomNumber] = useState('');
  const [leavingDate, setLeavingDate] = useState('');
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [pendingFees, setPendingFees] = useState(false);
  const [damages, setDamages] = useState(false);
  const [keyReturned, setKeyReturned] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const openApplication = () => {
    router.push('/student/hostel-application');
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const isValidDate = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const validateForm = () => {
    if (!studentId.trim()) {
      Alert.alert('Validation Error', 'Student ID is required.');
      return false;
    }

    if (!studentName.trim()) {
      Alert.alert('Validation Error', 'Student name is required.');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required.');
      return false;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return false;
    }

    if (!leavingDate.trim()) {
      Alert.alert('Validation Error', 'Leaving date is required.');
      return false;
    }

    if (!isValidDate(leavingDate)) {
      Alert.alert('Validation Error', 'Leaving date must be a valid date in YYYY-MM-DD format.');
      return false;
    }

    if (!reasonForLeaving.trim()) {
      Alert.alert('Validation Error', 'Reason for leaving is required.');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setStudentId('');
    setStudentName(user?.name || '');
    setEmail(user?.email || '');
    setRoomNumber('');
    setLeavingDate('');
    setReasonForLeaving('');
    setPendingFees(false);
    setDamages(false);
    setKeyReturned(false);
    setDamageDescription('');
    setBankName('');
    setBranchName('');
    setAccountHolderName('');
    setAccountNumber('');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const clearanceData = {
      studentId: studentId.trim(),
      studentName: studentName.trim(),
      email: email.trim(),
      roomNumber: roomNumber.trim(),
      leavingDate: leavingDate.trim(),
      reasonForLeaving: reasonForLeaving.trim(),
      pendingFees,
      damages,
      keyReturned,
      damageDescription: damages ? damageDescription.trim() : '',
      refundablePayment: {
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
      },
    };

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/clearance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clearanceData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit clearance form.');
      }

      Alert.alert('Success', 'Hostel clearance form submitted successfully.');
      resetForm();
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Home size={24} color={navy} />
          </View>
          <View>
            <Text style={styles.brandEyebrow}>UNIVERSITY HOSTEL</Text>
            <Text style={styles.brandTitle}>Student Portal</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={16} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navScroller}
        contentContainerStyle={styles.navContent}
      >
        <TouchableOpacity
          style={[styles.navButton, activeSection === 'dashboard' && styles.navButtonActive]}
          onPress={() => setActiveSection('dashboard')}
          activeOpacity={0.85}
        >
          <Home size={18} color={activeSection === 'dashboard' ? navy : '#FFFFFF'} />
          <Text style={[styles.navText, activeSection === 'dashboard' && styles.navTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, activeSection !== 'dashboard' && styles.navButtonActive]}
          onPress={() => setActiveSection('applications')}
          activeOpacity={0.85}
        >
          <ClipboardList size={18} color={activeSection !== 'dashboard' ? navy : '#FFFFFF'} />
          <Text style={[styles.navText, activeSection !== 'dashboard' && styles.navTextActive]}>
            My Application
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} activeOpacity={0.85}>
          <Bell size={18} color="#FFFFFF" />
          <Text style={styles.navText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} activeOpacity={0.85}>
          <User size={18} color="#FFFFFF" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {activeSection === 'dashboard' && (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>RESIDENCE PORTAL</Text>
              <Text style={styles.heroTitle}>Welcome, {user?.name || 'Student'}</Text>
              <Text style={styles.heroCopy}>
                Manage your hostel application from one place. Keep your profile updated and track
                approval status in real time.
              </Text>
            </View>

            <View style={styles.emptyStateWrap}>
              <View style={styles.emptyStateCard}>
                <View style={styles.emptyIcon}>
                  <ClipboardList size={30} color={navy} />
                </View>
                <Text style={styles.emptyTitle}>No Application Submitted</Text>
                <Text style={styles.emptyCopy}>You haven't submitted a hostel application yet.</Text>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={openApplication}
                  activeOpacity={0.85}
                >
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {activeSection === 'applications' && (
          <View style={styles.applicationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>MY APPLICATION</Text>
              <Text style={styles.sectionTitle}>Choose a Form</Text>
              <Text style={styles.sectionCopy}>
                Start a new hostel application or submit your hostel clearance request before
                leaving.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.applicationAction}
              onPress={openApplication}
              activeOpacity={0.85}
            >
              <View style={styles.applicationIcon}>
                <ClipboardList size={24} color={navy} />
              </View>
              <View style={styles.applicationTextWrap}>
                <Text style={styles.applicationTitle}>Hostel Application</Text>
                <Text style={styles.applicationCopy}>
                  Apply for hostel accommodation and submit student details.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applicationAction}
              onPress={() => setActiveSection('clearance')}
              activeOpacity={0.85}
            >
              <View style={styles.applicationIcon}>
                <LogOut size={24} color={navy} />
              </View>
              <View style={styles.applicationTextWrap}>
                <Text style={styles.applicationTitle}>Clearance Form</Text>
                <Text style={styles.applicationCopy}>
                  Request hostel clearance for leaving, fees, damages, and key return.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {activeSection === 'clearance' && (
          <View style={styles.clearanceSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>HOSTEL EXIT</Text>
            <Text style={styles.sectionTitle}>Clearance Form</Text>
            <Text style={styles.sectionCopy}>
              Submit this form before leaving the hostel so the office can review fees, room
              condition, and key return status.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={styles.input}
              value={studentId}
              onChangeText={setStudentId}
              placeholder="Enter student ID"
              placeholderTextColor="#7E8AA0"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Student Name</Text>
            <TextInput
              style={styles.input}
              value={studentName}
              onChangeText={setStudentName}
              placeholder="Enter full name"
              placeholderTextColor="#7E8AA0"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor="#7E8AA0"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Room Number</Text>
            <TextInput
              style={styles.input}
              value={roomNumber}
              onChangeText={setRoomNumber}
              placeholder="Enter room number"
              placeholderTextColor="#7E8AA0"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Leaving Date</Text>
            <TextInput
              style={styles.input}
              value={leavingDate}
              onChangeText={setLeavingDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#7E8AA0"
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Reason for Leaving</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reasonForLeaving}
              onChangeText={setReasonForLeaving}
              placeholder="Enter reason for leaving"
              placeholderTextColor="#7E8AA0"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Pending Fees</Text>
                <Text style={styles.switchHint}>{pendingFees ? 'Yes' : 'No'}</Text>
              </View>
              <Switch value={pendingFees} onValueChange={setPendingFees} />
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Damages</Text>
                <Text style={styles.switchHint}>{damages ? 'Yes' : 'No'}</Text>
              </View>
              <Switch
                value={damages}
                onValueChange={(value) => {
                  setDamages(value);
                  if (!value) {
                    setDamageDescription('');
                  }
                }}
              />
            </View>

            {damages && (
              <View style={styles.field}>
                <Text style={styles.label}>Damage Description</Text>
                <TextInput
                  style={[styles.input, styles.textAreaSmall]}
                  value={damageDescription}
                  onChangeText={setDamageDescription}
                  placeholder="Describe the damages"
                  placeholderTextColor="#7E8AA0"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            )}

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Key Returned</Text>
                <Text style={styles.switchHint}>{keyReturned ? 'Yes' : 'No'}</Text>
              </View>
              <Switch value={keyReturned} onValueChange={setKeyReturned} />
            </View>
          </View>

          <View style={styles.refundSection}>
            <View style={styles.refundHeader}>
              <Text style={styles.refundTitle}>Refundable Payment Details</Text>
              <Text style={styles.refundCopy}>
                Add bank details if any hostel deposit or refundable payment should be returned.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Enter bank name"
                placeholderTextColor="#7E8AA0"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Branch Name</Text>
              <TextInput
                style={styles.input}
                value={branchName}
                onChangeText={setBranchName}
                placeholder="Enter branch name"
                placeholderTextColor="#7E8AA0"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                placeholder="Enter account holder name"
                placeholderTextColor="#7E8AA0"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Enter account number"
                placeholderTextColor="#7E8AA0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Clearance'}
            </Text>
          </TouchableOpacity>
        </View>
        )}
      </ScrollView>
    </View>
  );
}

const navy = '#1F3F77';
const amber = '#FDB64D';
const pageBackground = '#EEE8DF';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: pageBackground,
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: navy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  brandRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  logoBox: {
    alignItems: 'center',
    backgroundColor: amber,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  brandEyebrow: {
    color: amber,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  logoutButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  navScroller: {
    backgroundColor: navy,
    maxHeight: 68,
  },
  navContent: {
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 18,
  },
  navButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  navButtonActive: {
    backgroundColor: amber,
    borderColor: amber,
  },
  navText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  navTextActive: {
    color: navy,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 22,
    paddingBottom: 36,
  },
  hero: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    elevation: 4,
    marginBottom: 22,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  heroEyebrow: {
    color: navy,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 12,
  },
  heroTitle: {
    color: navy,
    fontSize: 27,
    fontWeight: '900',
    marginBottom: 12,
  },
  heroCopy: {
    color: navy,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyStateWrap: {
    justifyContent: 'center',
    minHeight: 320,
  },
  emptyStateCard: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderColor: '#D6DCE8',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 8,
    maxWidth: 520,
    padding: 26,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    width: '100%',
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: '#EEF3FF',
    borderRadius: 8,
    height: 58,
    justifyContent: 'center',
    marginBottom: 14,
    width: 58,
  },
  emptyTitle: {
    color: navy,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyCopy: {
    color: navy,
    fontSize: 16,
    lineHeight: 23,
    marginTop: 12,
    textAlign: 'center',
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: navy,
    borderRadius: 10,
    elevation: 5,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 46,
    minWidth: 126,
    paddingHorizontal: 18,
    shadowColor: navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  applicationsSection: {
    backgroundColor: Colors.surface,
    borderColor: '#D6DCE8',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 5,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
  },
  applicationAction: {
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderColor: '#DDE5F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
    minHeight: 92,
    padding: 16,
  },
  applicationIcon: {
    alignItems: 'center',
    backgroundColor: '#EEF3FF',
    borderRadius: 8,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  applicationTextWrap: {
    flex: 1,
  },
  applicationTitle: {
    color: navy,
    fontSize: 17,
    fontWeight: '900',
  },
  applicationCopy: {
    color: '#405472',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  clearanceSection: {
    backgroundColor: Colors.surface,
    borderColor: '#D6DCE8',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 5,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionEyebrow: {
    color: amber,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 8,
  },
  sectionTitle: {
    color: navy,
    fontSize: 24,
    fontWeight: '900',
  },
  sectionCopy: {
    color: '#405472',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: navy,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C8D2E2',
    borderRadius: 8,
    borderWidth: 1,
    color: '#17243A',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 112,
  },
  textAreaSmall: {
    minHeight: 92,
  },
  switchGroup: {
    gap: 14,
    marginTop: 2,
  },
  switchRow: {
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    borderColor: '#DDE5F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  switchLabel: {
    color: navy,
    fontSize: 15,
    fontWeight: '800',
  },
  switchHint: {
    color: '#66748A',
    fontSize: 13,
    marginTop: 3,
  },
  refundSection: {
    backgroundColor: '#FFF9EF',
    borderColor: '#F3D59A',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  refundHeader: {
    marginBottom: 16,
  },
  refundTitle: {
    color: navy,
    fontSize: 18,
    fontWeight: '900',
  },
  refundCopy: {
    color: '#5F6470',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: navy,
    borderRadius: 8,
    elevation: 5,
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 52,
    paddingHorizontal: 18,
    shadowColor: navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
