// src/components/Stage2/index.tsx

'use client';

import {
  Button,
  Content,
  Flex,
  FlexItem,
  HelperText,
  HelperTextItem,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@patternfly/react-core';

import './index.css';

import InfoIcon from '@patternfly/react-icons/dist/esm/icons/info-icon';

import { useEffect, useState } from 'react';

import Table from '@/components/Table2';
import type { Column, DefaultDisplay, ActionButton } from '@/components/Table2';

import { conversionProfile, conversionProfileDisplay, equivalentConversionProfiles, creationDefault } from '@/utils/conversionProfiles';
import { defaultConversionProfiles, getConversionProfileDisplay } from '@/utils/conversionProfiles';
import SettingsIcon from './SettingsIcon';
import EyeIcon from './EyeIcon';
import EyeOffIcon from './EyeOffIcon';
import { TextInput } from '@/components/FormElements/TextInput';
import { DropdownMenu } from '@/components/FormElements/DropdownMenu';
import { Checkbox } from '@/components/FormElements/Checkbox';
import { TextArea } from '@/components/FormElements/TextArea';

type fileProfileDisplay = {
  name: string;
  type: string;
  size: string | number;
  profile: string;
};

type fileProfileData = {
  name: string;
  type: string;
  size: string | number;
  profileId: number;
};

type conversionPackage = {
  file: File;
  profileId: number;
}

export type fullConversionPackage = {
  file: File;
  profile: conversionProfile;
}

interface Stage2Props {
  toConvert: File[];
  nextStage: (packages: fullConversionPackage[]) => void;
  previousStage: () => void;
}

const Stage1: React.FunctionComponent<Stage2Props> = ({ toConvert, nextStage, previousStage }) => {
  const [conversionProfiles, setConversionProfiles] = useState<conversionProfile[]>(defaultConversionProfiles);
  const [conversionPackages, setConversionPackages] = useState<conversionPackage[]>(toConvert.map(entry => ({ file: entry, profileId: 5})));

  const [originalModalProfile, setOriginalModalProfile] = useState<conversionProfile | null>(null);
  const [modalProfile, setModalProfile] = useState<conversionProfile | null>(null);
  const [modalInitialAlias, setModalInitialAlias] = useState<string>("");
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const [aliasErrors, setAliasErrors] = useState<string[]>([]);
  const [placeholderErrors, setPlaceholderErrors] = useState<string[]>([]);
  const maxAliasCharacters = 50;
  const maxPlaceholderCharacters = 500;

  const [showSaveWarning, setShowSaveWarning] = useState<boolean>(false);

  const [showProfilesSection, setShowProfilesSection] = useState<boolean>(true);

  const fileTypeTranslations: { [key: string]: string } = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'image/*': 'Image',
    'text/html': 'HTML',
    'text/asciidoc': 'AsciiDoc',
    'text/markdown': 'Markdown'
  }

  const sizeForDisplay = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  const handleBack = () => {
    previousStage();
  }

  const handleFileConvert = () => {
    const fullPackages: fullConversionPackage[] = conversionPackages.map(pkg => {
      const profile = conversionProfiles.find(p => p.id === pkg.profileId);
      if (!profile) {
        throw new Error(`Conversion profile with ID ${pkg.profileId} not found`);
      }
      return { file: pkg.file, profile: profile };
    });
    nextStage(fullPackages);
  }

  const updateConversionPackages = (profileId: number, rows: fileProfileData[]) => {
    const selectedFilenames = rows.map(r => r.name);

    setConversionPackages(prev => prev.map(pkg => selectedFilenames.includes(pkg.file.name) ? { ...pkg, profileId: profileId } : pkg));
  }

  const getId = () => {
    const takenIds = conversionProfiles.map(profile => profile.id);
    let newId = 0;

    while (takenIds.includes(newId)) {
      newId++;
    }

    return newId;
  }

  const handleSaveProfile = (profile: conversionProfile) => {
    if (!getErrors(profile.alias, "alias") && !getErrors(profile.md_page_break_placeholder, "md_page_break_placeholder")) {
      if (conversionProfiles.map(p => p.id).includes(profile.id)) {
        setConversionProfiles(prev => {
          const updatedProfiles = prev.map(p => p.id === profile.id ? profile : p);
          return updatedProfiles;
        });
      } else {
        setConversionProfiles(prev => [...prev, {...profile, id: getId()}]);
      }
      setShowProfileModal(false);
    }
  }

  const getErrors = (value: string | boolean, accessor: keyof conversionProfile): boolean => {
    if (accessor === "alias") {
      const newAlias = value as string;
      let errors: string[] = [];

      if (conversionProfiles.map(profile => profile.alias).includes(newAlias) && newAlias !== modalInitialAlias) {
        errors.push(`The alias "${newAlias}" is already in use`);
      }

      if (newAlias.length > maxAliasCharacters) {
        errors.push(`${newAlias.length}/${maxAliasCharacters} characters`)
      }

      if (newAlias.trim() === "") {
        errors.push("Please enter an alias");
      }

      setAliasErrors(errors);

      return errors.length > 0;
    } else if (accessor === "md_page_break_placeholder") {
      const newPlaceholder = value as string;
      let errors: string[] = [];

      if (newPlaceholder.length > maxPlaceholderCharacters) {
        errors.push(`${newPlaceholder.length}/${maxPlaceholderCharacters} characters`)
      }

      setPlaceholderErrors(errors);
      
      return errors.length > 0;
    } 

    return false;
  }

  const handleModalProfileChange = (value: string | boolean, accessor: keyof conversionProfile) => {
    if (accessor === "alias") {
      const newAlias = value as string;

      getErrors(newAlias, accessor);
      setModalProfile(prev => prev ? { ...prev, [accessor]: newAlias } : null);
    } else if (accessor === "md_page_break_placeholder") {
      const newPlaceholder = value as string;
      
      getErrors(newPlaceholder, accessor);
      setModalProfile(prev => prev ? { ...prev, [accessor]: newPlaceholder } : null);
    } else {
      setModalProfile(prev => prev ? { ...prev, [accessor]: value } : null);
    }
  }

  const handleProfileOpen = (profile: conversionProfile) => {
    setOriginalModalProfile(profile);
    setModalProfile(profile);
    setModalInitialAlias(profile.alias);
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setShowProfileModal(true);
  }

  const handleCreateProfile = () => {
    setOriginalModalProfile(null);
    setModalProfile(creationDefault);
    setModalInitialAlias("");
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setShowProfileModal(true);
  }

  const handleCloseProfileModal = () => {
    if (modalProfile !== null && originalModalProfile != null && equivalentConversionProfiles(modalProfile, originalModalProfile)) {
      setShowProfileModal(false);
      setModalProfile(null);
      setOriginalModalProfile(null);
      setAliasErrors([]);
      setPlaceholderErrors([]);
      setModalInitialAlias("");
    } else {
      setShowSaveWarning(true);
    }
  }

  const closeAllModals = () => {
    setShowSaveWarning(false);
    setShowProfileModal(false);
    setModalProfile(null);
    setOriginalModalProfile(null);
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setModalInitialAlias("");
  }

  const dismissWarning = () => {
    setShowSaveWarning(false);
  }

  const columns: Column<conversionProfile, conversionProfileDisplay>[] = [
    { header: "Settings", data_accessor: "settings", display_accessor: "settings", type: "custom-90", display: { type: "action-button", onClick: handleProfileOpen, innerComponent: <SettingsIcon/>}, disable_sort: true },
    { header: "Alias", data_accessor: "alias", display_accessor: "alias", type: "expands", display: { type: "default" } },
    { header: "VLM", data_accessor: "pipeline", display_accessor: "vlm", type: "custom-90", display: { type: "default" } },
    { header: "OCR", data_accessor: "do_ocr", display_accessor: "ocr", type: "custom-90", display: { type: "default" } },
    { header: "Force OCR", data_accessor: "force_ocr", display_accessor: "force_ocr", type: "custom-120", display: { type: "default" } },
    { header: "OCR Engine", data_accessor: "ocr_engine", display_accessor: "ocr_engine", type: "custom-150", display: { type: "default" } },
    { header: "Table Mode", data_accessor: "table_mode", display_accessor: "table_mode", type: "custom-130", display: { type: "default" } },
  ];

  useEffect(() => {
    const conversionIds = conversionProfiles.map(p => p.id);
    const updatedPackages = conversionPackages.map(pkg => conversionIds.includes(pkg.profileId) ? pkg : { ...pkg, profileId: 0 });
    setConversionPackages(updatedPackages);
  }, [conversionProfiles]);

  return (
    <>
      <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGap2xl'}}>
        <FlexItem>
          <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapMd'}}>
            <FlexItem>
              <Content component='h1'>Step 2. Convert files</Content>
            </FlexItem>
            <FlexItem>
              <Content component='p'>Files must be converted to Markdown format before being added to the workspace. Convert files below with <Content component='a' href='https://docling-project.github.io/docling/' rel='noopener noreferrer' target='_blank'>Docling</Content></Content>
            </FlexItem>
          </Flex>
        </FlexItem>

        <FlexItem>
          <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapMd'}}>
            <FlexItem>
              <Flex>
                <FlexItem>
                  <Content component='h2'>Manage conversion profiles</Content>
                </FlexItem>
                <FlexItem style={{ width: '20px', transform: 'translateY(4.5px)'}}>
                  {showProfilesSection ? (
                    <div className='eye' onClick={() => setShowProfilesSection(false)}>
                      <EyeIcon/>
                    </div>
                  ) : (
                    <div className='eye' onClick={() => setShowProfilesSection(true)}>
                      <EyeOffIcon/>
                    </div>
                  )}
                </FlexItem>
              </Flex>
            </FlexItem>
            { showProfilesSection && (
              <>
                <FlexItem>
                  <Content component='p'>Use the conversion profiles below or create your own to customize the document conversion settings to best fit each document. See best practices <Content component='a' href='https://github.com/fabianofranz/docling-conversion-tutorials/tree/main' rel='noopener noreferrer' target='_blank'>here</Content></Content>
                </FlexItem>
                <FlexItem>
                  <Table 
                    columns={columns} 
                    data={conversionProfiles.map(profile => ({
                      value: profile,
                      display: getConversionProfileDisplay(profile),
                      permanent: !profile.editable
                    }))} 
                    reconcileData={setConversionProfiles} 
                    noContentText={"No conversion profiles"}
                    removeTitles={["Remove profile?", "Remove all?", "Remove selected profiles?"]}
                    removeTexts={['Are you sure you want to remove this conversion profile? Any files using this conversion profile will be changed to "Default"', 'Are you sure you want to remove all non-default conversion profiles? Any files using these conversion profiles will be changed to "Default". Red Hat-provided defaults will remain intact', 'Are you sure you want to remove these conversion profiles? Any files using these conversion profiles will be changed to "Default". Red Hat-provided defaults will not be removed']}
                    removeButton
                  />
                </FlexItem>
                <FlexItem>
                  <Button style={{ marginTop: '1rem' }} variant="primary" onClick={handleCreateProfile}>
                    Add Conversion Profile
                  </Button>
                </FlexItem>
              </>
            )}
          </Flex>
        </FlexItem>

        <FlexItem>
          <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapMd'}}>
            <FlexItem>
              <Content component='h2'>Assign conversion profiles</Content>
            </FlexItem>
            <FlexItem>
              <Content component='p'>Specify the settings to be used to convert each document by assigning them conversion profiles. Conversion profiles are created/managed above</Content>
            </FlexItem>
            <FlexItem>
              <HelperText>
                <HelperTextItem icon={<InfoIcon />}>
                  Tip! Select multiple files with SHIFT and CTRL and use one drop down to set the conversion profile for all of the files
                </HelperTextItem>
              </HelperText>
            </FlexItem>
            <FlexItem>
              <Table<fileProfileData, fileProfileDisplay> 
                columns={[
                  { header: "Name", data_accessor: "name", display_accessor: "name", type: "expands", display: { type: "default" } },
                  { header: "Type", data_accessor: "type", display_accessor: "type", type: "md", display: { type: "default" } },
                  { header: "Size", data_accessor: "size", display_accessor: "size", type: "sm", display: { type: "default" } },
                  { header: "Conversion Profile", data_accessor: "profileId", display_accessor: "profile", type: "custom-420", 
                    display: { 
                      type: "dropdown-menu",
                      options: conversionProfiles.map(p => ({ label: p.alias, id: p.id })),
                      onChange: updateConversionPackages
                    }
                  },
                ]} 
                data={conversionPackages.map((pkg, index) => ({
                  value: {
                    name: pkg.file.name,
                    type: pkg.file.type,
                    size: pkg.file.size,
                    profileId: pkg.profileId
                  }, 
                  display: {
                    name: pkg.file.name,
                    type: fileTypeTranslations[pkg.file.type],
                    size: sizeForDisplay(pkg.file.size),
                    profile: conversionProfiles.find(p => p.id === pkg.profileId)?.alias || "Unknown"
                  },
                }))}
                reconcileData={() => {}}
                noContentText="No uploads of this type"
                removeTitles={[]}
                removeTexts={[]}
              />
            </FlexItem>
          </Flex>
        </FlexItem>

        <FlexItem>
          <Flex gap={{ default: 'gapSm' }}>
            <FlexItem>
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            </FlexItem>
            <FlexItem>
              <Button variant="primary" onClick={handleFileConvert}>
                Convert files
              </Button>
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>

      {showProfileModal && modalProfile && (
        <Modal
          isOpen
          onClose={handleCloseProfileModal}
          disableFocusTrap
          aria-label="conversion profile settings"
          aria-labelledby="conversion-profile-settings-title"
          aria-describedby="conversion-profile-settings-variant"
          style={{ maxWidth: "min(1600px, 97.5%)", overflow: "visible" }}
        >
          <ModalHeader title={modalInitialAlias.length == 0 ? "Create conversion profile" : modalProfile.editable ? "Edit conversion profile" : "View conversion profile"} labelId="conversion-profile-settings-title" />
          <ModalBody id="conversion-profile-settings-variant" style={{ overflow: 'visible'}}>
            {modalInitialAlias.length == 0 ? (
              <Content component='p'>Edit the provided default settings below to create a new conversion profile. The profile must have an original alias</Content>
            ) : modalProfile.editable ? (
              <Content component='p'>View and apply changes to the settings for the <strong>{`"${modalInitialAlias}"`}</strong> conversion profile below</Content>
            ) : (
              <Content component='p'>View the settings for the <strong>{`"${modalInitialAlias}"`}</strong> Red Hat default conversion profile below. The settings of default conversion profiles are immutable</Content>
            )}
            <Flex style={{ marginTop: '2rem', marginBottom: '1.5rem', gap: '5rem' }}>
              {/* Row 1 (alias and multi-selects) */}
              <FlexItem style={{ flex: 3 }}>
                <Flex style={{ flexDirection: 'column', gap: '1rem'}}>
                  <FlexItem style={{ width: '100%' }}>
                    <Flex>
                      <FlexItem style={{ width: 'max(100px, 25%)' }}>
                        <Content component='p'>Alias:</Content>
                      </FlexItem>
                      <FlexItem style={{ flex: 1 }}>
                        <TextInput
                          placeholder="Name for these settings..."
                          value={modalProfile.alias}
                          setValue={(value) => handleModalProfileChange(value, "alias")}
                          errors={aliasErrors}
                          maxCharacters={maxAliasCharacters}
                          disabled={!modalProfile.editable}
                        />
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem style={{ width: '100%' }}>
                    <Flex>
                      <FlexItem style={{ width: 'max(100px, 25%)' }}>
                        <Content component='p'>Image Export Mode:</Content>
                      </FlexItem>
                      <FlexItem style={{ flex: 1 }}>
                        <DropdownMenu
                          options={[
                            { value: 'embedded', label: 'Embedded (default)' },
                            { value: 'placeholder', label: 'Placeholder' },
                            { value: 'referenced', label: 'Referenced' }
                          ]}
                          value={modalProfile.image_export_mode}
                          setValue={(value) => handleModalProfileChange(value, "image_export_mode")}
                          disabled={!modalProfile.editable}
                        />
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem style={{ width: '100%' }}>
                    <Flex>
                      <FlexItem style={{ width: 'max(100px, 25%)' }}>
                        <Content component='p'>Pipeline Type:</Content>
                      </FlexItem>
                      <FlexItem style={{ flex: 1 }}>
                        <DropdownMenu
                          options={[
                            { value: 'standard', label: 'Standard (default)' },
                            { value: 'vlm', label: 'VLM' }
                          ]}
                          value={modalProfile.pipeline}
                          setValue={(value) => handleModalProfileChange(value, "pipeline")}
                          disabled={!modalProfile.editable}
                        />
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem style={{ width: '100%' }}>
                    <Flex>
                      <FlexItem style={{ width: 'max(100px, 25%)' }}>
                        <Content component='p'>OCR Engine:</Content>
                      </FlexItem>
                      <FlexItem style={{ flex: 1 }}>
                        <DropdownMenu
                          options={[
                            { value: 'easyocr', label: 'EasyOCR (default)' },
                            { value: 'tesseract_cli', label: 'Tesseract CLI' },
                            { value: 'tesseract', label: 'Tesseract' },
                            { value: 'rapidocr', label: 'RapidOCR' },
                            { value: 'ocrmac', 'label': 'OCRMac' }
                          ]}
                          value={modalProfile.ocr_engine}
                          setValue={(value) => handleModalProfileChange(value, "ocr_engine")}
                          disabled={!modalProfile.editable}
                        />
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem style={{ width: '100%' }}>
                    <Flex>
                      <FlexItem style={{ width: 'max(100px, 25%)' }}>
                        <Content component='p'>PDF Backend:</Content>
                      </FlexItem>
                      <FlexItem style={{ flex: 1 }}>
                        <DropdownMenu
                          options={[
                            { value: 'pypdfium2', label: 'pypdfium2' },
                            { value: 'dlparse_v1', label: 'dlparse_v1' },
                            { value: 'dlparse_v2', label: 'dlparse_v2' },
                            { value: 'dlparse_v4', label: 'dlparse_v4 (default)' }
                          ]}
                          value={modalProfile.pdf_backend}
                          setValue={(value) => handleModalProfileChange(value, "pdf_backend")}
                          disabled={!modalProfile.editable}
                        />
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem style={{ width: '100%' }}>
                    <Flex>
                      <FlexItem style={{ width: 'max(100px, 25%)' }}>
                        <Content component='p'>Table Mode:</Content>
                      </FlexItem>
                      <FlexItem style={{ flex: 1 }}>
                        <DropdownMenu
                          options={[
                            { value: 'fast', label: 'Fast (default)' },
                            { value: 'accurate', label: 'Accurate' },
                          ]}
                          value={modalProfile.table_mode}
                          setValue={(value) => handleModalProfileChange(value, "table_mode")}
                          disabled={!modalProfile.editable}
                        />
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                </Flex>
              </FlexItem>

              {/* Row 2 (checkboxes) */}
              <FlexItem style={{ flex: 2, display: 'flex', alignItems: 'center' }}>
                <Flex style={{ flexDirection: 'column', gap: '0.8rem' }}>
                  <FlexItem style={{ marginBottom: '0.5rem' }}>
                    <Content style={{ fontSize: '0.8rem'}} component="p">Want to learn more about these options? Click <Content style={{ fontSize: '0.8rem' }} component="a" href="https://github.com/docling-project/docling-serve/blob/main/docs/usage.md" target="_blank" rel="noopener noreferrer">here</Content> </Content>
                  </FlexItem>

                  <FlexItem>
                    <Flex style={{ paddingRight: '1rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleModalProfileChange(!modalProfile.do_ocr, 'do_ocr')}>
                      <FlexItem style={{ display: 'flex', alignItems: 'center', margin: '0 0.75rem 0 0' }}>
                          <Checkbox
                            value={modalProfile.do_ocr}
                            setValue={(value) => handleModalProfileChange(value, 'do_ocr')}
                            disabled={!modalProfile.editable}
                          />
                      </FlexItem>
                      <FlexItem>
                          <Content style={{ 'userSelect': 'none' }} component='p'>Allow optical character recognition (OCR)</Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Flex style={{ paddingRight: '1rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleModalProfileChange(!modalProfile.force_ocr, 'force_ocr')}>
                      <FlexItem style={{ display: 'flex', alignItems: 'center', margin: '0 0.75rem 0 0' }}>
                          <Checkbox
                            value={modalProfile.force_ocr}
                            setValue={(value) => handleModalProfileChange(value, 'force_ocr')}
                            disabled={!modalProfile.editable}
                          />
                      </FlexItem>
                      <FlexItem>
                          <Content style={{ 'userSelect': 'none' }} component='p'>Force optical character recognition (OCR)</Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Flex style={{ paddingRight: '1rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleModalProfileChange(!modalProfile.do_code_enrichment, 'do_code_enrichment')}>
                      <FlexItem style={{ display: 'flex', alignItems: 'center', margin: '0 0.75rem 0 0' }}>
                          <Checkbox
                            value={modalProfile.do_code_enrichment}
                            setValue={(value) => handleModalProfileChange(value, 'do_code_enrichment')}
                            disabled={!modalProfile.editable}
                          />
                      </FlexItem>
                      <FlexItem>
                          <Content style={{ 'userSelect': 'none' }} component='p'>Code enrichment</Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Flex style={{ paddingRight: '1rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleModalProfileChange(!modalProfile.do_formula_enrichment, 'do_formula_enrichment')}>
                      <FlexItem style={{ display: 'flex', alignItems: 'center', margin: '0 0.75rem 0 0' }}>
                          <Checkbox
                            value={modalProfile.do_formula_enrichment}
                            setValue={(value) => handleModalProfileChange(value, 'do_formula_enrichment')}
                            disabled={!modalProfile.editable}
                          />
                      </FlexItem>
                      <FlexItem>
                          <Content style={{ 'userSelect': 'none' }} component='p'>Formula enrichment</Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Flex style={{ paddingRight: '1rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleModalProfileChange(!modalProfile.do_picture_classification, 'do_picture_classification')}>
                      <FlexItem style={{ display: 'flex', alignItems: 'center', margin: '0 0.75rem 0 0' }}>
                          <Checkbox
                            value={modalProfile.do_picture_classification}
                            setValue={(value) => handleModalProfileChange(value, 'do_picture_classification')}
                            disabled={!modalProfile.editable}
                          />
                      </FlexItem>
                      <FlexItem>
                          <Content style={{ 'userSelect': 'none' }} component='p'>Picture classification</Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Flex style={{ paddingRight: '1rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleModalProfileChange(!modalProfile.do_picture_description, 'do_picture_description')}>
                      <FlexItem style={{ display: 'flex', alignItems: 'center', margin: '0 0.75rem 0 0' }}>
                          <Checkbox
                            value={modalProfile.do_picture_description}
                            setValue={(value) => handleModalProfileChange(value, 'do_picture_description')}
                            disabled={!modalProfile.editable}
                          />
                      </FlexItem>
                      <FlexItem>
                          <Content style={{ 'userSelect': 'none' }} component='p'>Picture description</Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Flex style={{ paddingRight: '1rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleModalProfileChange(!modalProfile.do_table_structure, 'do_table_structure')}>
                      <FlexItem style={{ display: 'flex', alignItems: 'center', margin: '0 0.75rem 0 0' }}>
                          <Checkbox
                            value={modalProfile.do_table_structure}
                            setValue={(value) => handleModalProfileChange(value, 'do_table_structure')}
                            disabled={!modalProfile.editable}
                          />
                      </FlexItem>
                      <FlexItem>
                          <Content style={{ 'userSelect': 'none' }} component='p'>Do tables</Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
            <Content component='p' style={{ marginBottom: '0.75rem' }}>Page Break Placeholder:</Content>
            <TextArea
              placeholder='None'
              value={modalProfile.md_page_break_placeholder}
              setValue={(value) => handleModalProfileChange(value, "md_page_break_placeholder")}
              errors={placeholderErrors}
              maxCharacters={maxPlaceholderCharacters}
              disabled={!modalProfile.editable}
            />
          </ModalBody>
          { modalProfile.editable && (
            <ModalFooter>
              <Button isDisabled={aliasErrors.length > 0 || placeholderErrors.length > 0} key="save" variant="primary" onClick={() => handleSaveProfile(modalProfile)}>
                {modalInitialAlias.length == 0 ? "Create profile" : "Save changes"}
              </Button>
            </ModalFooter>
          )}
        </Modal>
      )}

      {showSaveWarning && (
        <Modal
          isOpen
          disableFocusTrap
          variant="small"
          aria-label="unsaved changes warning"
          aria-labelledby="unsaved-changes-warning-title"
          aria-describedby="unsaved-changes-warning-variant"
        >
          <ModalHeader title="Unsaved Changes" labelId="unsaved-changes-warning-title" titleIconVariant="warning" />
          <ModalBody id="unsaved-changes-warning-variant">
            <Content component='p'>Are you sure you want to exit? Changes have been made to this profile that will not be saved</Content>
          </ModalBody>
          <ModalFooter>
            <Flex>
              <FlexItem>
                <Button key="discard" variant="danger" onClick={closeAllModals}>
                  Discard changes
                </Button>
              </FlexItem>

              <FlexItem>
                <Button key="cancel" variant="secondary" onClick={dismissWarning}>
                  Cancel
                </Button>
              </FlexItem>
            </Flex>
          </ModalFooter>
        </Modal>
      )}
    </>
  )
}

export default Stage1;