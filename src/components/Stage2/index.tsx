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
  ModalFooter,
} from '@patternfly/react-core';

import InfoIcon from '@patternfly/react-icons/dist/esm/icons/info-icon';

import { useState } from 'react';

import Table from '@/components/Table2';
import type { Column, DefaultDisplay, ActionButton } from '@/components/Table2';

import type { conversionProfile, conversionProfileDisplay } from '@/utils/conversionProfiles';
import { defaultConversionProfiles, getConversionProfileDisplay } from '@/utils/conversionProfiles';
import SettingsIcon from './SettingsIcon';
import { TextInput } from '@/components/FormElements/TextInput';

interface Stage2Props {
  workspaceFiles: File[];
  nextStage: (files: File[]) => void;
}

const Stage1: React.FunctionComponent<Stage2Props> = ({ workspaceFiles, nextStage }) => {
  const [files, setFiles] = useState<File[]>([]);

  const [conversionProfiles, setConversionProfiles] = useState<conversionProfile[]>(defaultConversionProfiles);

  const [modalProfile, setModalProfile] = useState<conversionProfile | null>(null);
  const [modalInitialAlias, setModalInitialAlias] = useState<string>("");
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const [aliasErrors, setAliasErrors] = useState<string[]>([]);
  const maxAliasCharacters = 50;

  const handleModalProfileChange = (value: string | boolean, accessor: keyof conversionProfile) => {
    if (accessor === "alias") {
      const newAlias = value as string;
      let errors: string[] = [];

      if (conversionProfiles.map(profile => profile.alias).includes(newAlias) && newAlias !== modalInitialAlias) {
        errors.push(`The alias "${newAlias}" is already in use`);
      }

      if (newAlias.length > maxAliasCharacters) {
        errors.push(`${newAlias.length}/${maxAliasCharacters} characters`)
      }

      setAliasErrors(errors);

      setModalProfile(prev => prev ? { ...prev, [accessor]: newAlias } : null);
    }
  }

  const handleProfileOpen = (profile: conversionProfile) => {
    setModalProfile(profile);
    setModalInitialAlias(profile.alias);
    setAliasErrors([]);
    setShowProfileModal(true);
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
              <Content component='h2'>Manage conversion profiles</Content>
            </FlexItem>
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
                removeTexts={["Are you sure you want to remove this conversion profile?", "Are you sure you want to remove all non-default conversion profiles? Red Hat-provided defaults will remain intact", "Are you sure you want to remove these conversion profiles? Default conversion profiles will not be removed"]}
                removeButton
              />
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>

      {showProfileModal && modalProfile && (
        <Modal
          isOpen
          onClose={() => setShowProfileModal(false)}
          disableFocusTrap
          aria-label="conversion profile settings"
          aria-labelledby="conversion-profile-settings-title"
          aria-describedby="conversion-profile-settings-variant"
          style={{ maxWidth: "min(1600px, 97.5%)" }}
        >
          <ModalHeader title={modalProfile.editable ? "Edit conversion profile" : "View conversion profile"} labelId="conversion-profile-settings-title" />
          <ModalBody id="conversion-profile-settings-variant">
            {modalProfile.editable ? (
              <Content component='p'>View and apply changes to the settings for the <strong>{`"${modalInitialAlias}"`}</strong> conversion profile below</Content>
            ) : (
              <Content component='p'>View the settings for the <strong>{`"${modalInitialAlias}"`}</strong> Red Hat default conversion profile below. The settings of default conversion profiles are immutable</Content>
            )}
            <Flex style={{ gap: '2rem', marginTop: '2rem', width: "100%" }}>
              <FlexItem style={{ flex: 1}}>
                <Flex>
                  <FlexItem>
                    <Content component='p'>Alias:</Content>
                  </FlexItem>
                  <FlexItem style={{ flex: 1 }}>
                    <TextInput
                      placeholder="Name for these settings..."
                      value={modalProfile.alias}
                      setValue={(value) => handleModalProfileChange(value, "alias")}
                      errors={aliasErrors}
                      maxCharacters={maxAliasCharacters}
                    />
                  </FlexItem>
                </Flex>
              </FlexItem>

              <FlexItem>
                <Flex>

                </Flex>
              </FlexItem>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button key="save" variant="primary" onClick={() => alert("saving!")}>
              Save changes
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  )
}

export default Stage1;