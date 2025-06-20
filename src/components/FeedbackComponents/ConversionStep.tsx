// src/components/FeedbackComponents/ConversionStep.tsx

'use client';

import './TableStyling.css';
import './ModalStyling.css';

import {
  Flex,
  FlexItem,
  Card,
  CardTitle,
  CardBody,
  Badge,
  Toolbar,
  ToolbarItem,
  ToolbarContent,
  SearchInput,
  MenuToggleCheckbox,
  MenuToggle,
  Button,
  Icon,
  Content,
  MenuToggleElement,
  Dropdown,
  DropdownItem,
  DropdownList,
  Divider,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  TextInput,
  Checkbox,
  TextArea
} from '@patternfly/react-core';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@patternfly/react-table'

import { useState, useEffect, useRef } from 'react';

import ConversionHeader from './ConversionHeader';
import FileUpload from './FileUpload';

import { conversionProfile, conversionProfileDisplay, equivalentConversionProfiles, creationDefault, defaultConversionProfiles, getConversionProfileDisplay } from '@/utils/conversionProfiles';

import WarningIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import FileAlt from '@patternfly/react-icons/dist/esm/icons/outlined-file-alt-icon';
import FileCode from '@patternfly/react-icons/dist/esm/icons/outlined-file-code-icon';
import FileExcel from '@patternfly/react-icons/dist/esm/icons/outlined-file-excel-icon';
import FileIcon from '@patternfly/react-icons/dist/esm/icons/outlined-file-icon';
import FileImage from '@patternfly/react-icons/dist/esm/icons/outlined-file-image-icon';
import FilePDF from '@patternfly/react-icons/dist/esm/icons/outlined-file-pdf-icon';
import FilePowerpoint from '@patternfly/react-icons/dist/esm/icons/outlined-file-powerpoint-icon';
import FileWord from '@patternfly/react-icons/dist/esm/icons/outlined-file-word-icon';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';

type Resource = {
  datetimeUploaded: Date;
  originalFile: File | null;
  file: File;
  conversionProfile: string;
}

type ConversionStepProps = {

}

// Later, add workspace file support
// Figure out max dropdown menu height
// Correct path of create disable, warning text, click
// Capitalized JPG file type unknown

const ConversionStep: React.FunctionComponent<ConversionStepProps> = ({  }) => {
  const [page, setPage] = useState(1);
  const [showConversionProfiles, setShowConversionProfiles] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);

  const workspaceFiles: File[] = [];

  // ------ CARD THINGS ------

  const [expandedGroupNames, setExpandedGroupNames] = useState<string[]>([]);
  const setGroupExpanded = (group: string, isExpanding = true) =>
    setExpandedGroupNames((prevExpanded) => {
      const otherExpandedGroupNames = prevExpanded.filter((groupName) => groupName !== group);
      return isExpanding ? [...otherExpandedGroupNames, group] : otherExpandedGroupNames;
    });
  const isGroupExpanded = (group: string) => expandedGroupNames.includes(group);

  const [conversionRequiredResources, setConversionRequiredResources] = useState<Resource[]>([]);
  const [uploadCompleteResources, setUploadCompleteResources] = useState<Resource[]>([]);

  const [shownConversionRequiredResources, setShownConversionRequiredResources] = useState<Resource[]>([]);
  const [shownUploadCompleteResources, setShownUploadCompleteResources] = useState<Resource[]>([]);

  const [selectedConversionRequiredFileNames, setSelectedConversionRequiredFileNames] = useState<string[]>([]);
  const [selectedUploadCompleteFileNames, setSelectedUploadCompleteFileNames] = useState<string[]>([]);

  const setResourceSelected = (resource: Resource, isSelecting = true, group: string) => {
    if (group === 'conversion-required') {
      setSelectedConversionRequiredFileNames((prevSelected) => {
        const otherSelectedFileNames = prevSelected.filter((file_name) => file_name !== resource.file.name);
        return isSelecting ? [...otherSelectedFileNames, resource.file.name] : otherSelectedFileNames;
      });
    } else if (group === 'upload-complete') {
      setSelectedUploadCompleteFileNames((prevSelected) => {
        const otherSelectedFileNames = prevSelected.filter((file_name) => file_name !== resource.file.name);
        return isSelecting ? [...otherSelectedFileNames, resource.file.name] : otherSelectedFileNames;
      });
    }
  }

  const selectAllFiles = (isSelecting = true, group: string) => {
    if (group === 'conversion-required') {
      setSelectedConversionRequiredFileNames(isSelecting ? conversionRequiredResources.map((resource) => resource.file.name) : []);
    } else if (group === 'upload-complete') {
      setSelectedUploadCompleteFileNames(isSelecting ? uploadCompleteResources.map((resource) => resource.file.name) : []);
    } else if (group === 'all') {
      setSelectedConversionRequiredFileNames(isSelecting ? conversionRequiredResources.map((resource) => resource.file.name) : []);
      setSelectedUploadCompleteFileNames(isSelecting ? uploadCompleteResources.map((resource) => resource.file.name) : []);
    }

    setSelectFilesDropdownOpen(false);
  }

  const areAllConversionRequiredResourcesSelected = selectedConversionRequiredFileNames.length === conversionRequiredResources.length;
  const areAllUploadCompleteResourcesSelected = selectedUploadCompleteFileNames.length === uploadCompleteResources.length;

  const isResourceSelected = (resource: Resource) => [...selectedConversionRequiredFileNames, ...selectedUploadCompleteFileNames].includes(resource.file.name);

  const [recentSelectedRowIndex, setRecentSelectedRowIndex] = useState<number | null>(null);
  const [shifting, setShifting] = useState(false);

  const onSelectResource = (resource: Resource, rowIndex: number, isSelecting: boolean) => {
    if (shifting && recentSelectedRowIndex !== null) {
      const numberSelected = rowIndex - recentSelectedRowIndex;
      const intermediateIndexes =
        numberSelected > 0
          ? Array.from(new Array(numberSelected + 1), (_x, i) => i + recentSelectedRowIndex)
          : Array.from(new Array(Math.abs(numberSelected) + 1), (_x, i) => i + rowIndex);
      intermediateIndexes.forEach((index) => setResourceSelected([...conversionRequiredResources, ...uploadCompleteResources][index], isSelecting, index < conversionRequiredResources.length ? 'conversion-required' : 'upload-complete'));
    } else {
      setResourceSelected(resource, isSelecting, rowIndex < conversionRequiredResources.length ? 'conversion-required' : 'upload-complete');
    }
    setRecentSelectedRowIndex(rowIndex);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShifting(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShifting(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const getFileStem = (file: File): string => {
    return file.name.split('.').slice(0, -1).join('.');
  }

  const onUpload = (toOverwrite: File[], toUpload: File[]) => {
    const conversionRequiredClosed = conversionRequiredResources.length == 0;
    const uploadCompleteClosed = uploadCompleteResources.length == 0;

    const newConversionRequiredResources = conversionRequiredResources.filter(
      (resource) => !toOverwrite.some(fileToRemove => getFileStem(fileToRemove) === getFileStem(resource.file))
    );

    const newUploadCompleteResources = uploadCompleteResources.filter(
      (resource) => !toOverwrite.some(fileToRemove => getFileStem(fileToRemove) === getFileStem(resource.file))
    );

    Promise.resolve().then(() => {
      setConversionRequiredResources(() => {
        const selectFiles = [...toOverwrite, ...toUpload].filter((file) => file.type !== 'text/markdown')
        const newResouces = selectFiles.map((file) => {
          return ({
            "datetimeUploaded": new Date(),
            "originalFile": null,
            "file": file,
            "conversionProfile": "Default"
          })
        })
  
        return [...newConversionRequiredResources, ...newResouces];
      })
    }).then(() => {
      setUploadCompleteResources(() => {
        const selectFiles = [...toOverwrite, ...toUpload].filter((file) => file.type === 'text/markdown')
        const newResouces = selectFiles.map((file) => {
          return ({
            "datetimeUploaded": new Date(),
            "originalFile": null,
            "file": file,
            "conversionProfile": "None"
          })
        })
  
        return [...newUploadCompleteResources, ...newResouces];
      })
    }).then(() => {
      let closeGroup: string[] = []

      if (!conversionRequiredClosed && newConversionRequiredResources.length === 0) {
        closeGroup.push("conversion-required");
      }

      if (!uploadCompleteClosed && newUploadCompleteResources.length === 0) {
        closeGroup.push("upload-complete");
      }

      setExpandedGroupNames((prev) => prev.filter((group) => !closeGroup.includes(group)));
    })
  }

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

  const getfileIcon = (type: string) => {
    switch (type) {
      case 'application/pdf':
        return <Icon><FilePDF /></Icon>;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <Icon><FilePowerpoint /></Icon>;
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return <Icon><FileWord /></Icon>;
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return <Icon><FileExcel /></Icon>;
      case 'image/*':
        return <Icon><FileImage /></Icon>;
      case 'text/html':
        return <Icon><FileCode /></Icon>;
      case 'text/asciidoc':
        return <Icon><FileAlt /></Icon>;
      case 'text/markdown':
        return <Icon><FileAlt /></Icon>;
      case 'default':
        return <Icon><FileIcon /></Icon>;
    }
  }

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    };
  
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDate = formatter.format(date);
  
    return `Uploaded ${formattedDate} EST`;
  }

  const [conversionProfiles, setConversionProfiles] = useState<conversionProfile[]>(defaultConversionProfiles);
  const [openProfileDropdown, setOpenProfileDropdown] = useState<string | null>(null);

  const onToggleClick = (name: string) => {
    if (openProfileDropdown === name) {
      setOpenProfileDropdown(null);
    } else {
      setOpenProfileDropdown(name);
    }
  }

  const handleProfileSelect = (resource: Resource, profile: conversionProfile) => {
    setConversionRequiredResources((prevResources) => {
      return prevResources.map((res) => {
        if (res.file.name === resource.file.name) {
          return { ...res, conversionProfile: profile.alias };
        }
        return res;
      });
    });
    setOpenProfileDropdown(null);
  }

  const [openFileActionsDropdown, setOpenFileActionsDropdown] = useState<string | null>(null);

  const onActionsToggleClick = (name: string) => {
    if (openFileActionsDropdown === name) {
      setOpenFileActionsDropdown(null);
    } else {
      setOpenFileActionsDropdown(name);
    }
  }

  const handleFileActionSelect = (resource: Resource, value: string) => {
    if (value === "delete") {
      removeResources([resource]);
    }

    setOpenFileActionsDropdown(null);
  }

  const removeResources = (resources: Resource[]) => {
    const newConversionRequiredResources = conversionRequiredResources.filter(
      (resource) => !resources.some(resourceToRemove => getFileStem(resourceToRemove.file) === getFileStem(resource.file))
    );

    const newUploadCompleteResources = uploadCompleteResources.filter(
      (resource) => !resources.some(resourceToRemove => getFileStem(resourceToRemove.file) === getFileStem(resource.file))
    );

    let closeGroup: string[] = []

    if (newConversionRequiredResources.length !== conversionRequiredResources.length && newConversionRequiredResources.length === 0) {
      closeGroup.push("conversion-required");
    }

    if (newUploadCompleteResources.length !== uploadCompleteResources.length && newUploadCompleteResources.length === 0) {
      closeGroup.push("upload-complete");
    }

    setExpandedGroupNames((prev) => prev.filter((group) => !closeGroup.includes(group)));

    setConversionRequiredResources(newConversionRequiredResources);
    setUploadCompleteResources(newUploadCompleteResources);
  }

  // ------ MODAL THINGS -------

  const handleConversionProfilesClose = () => {
    if (isDangerous && !showSaveWarning) {
      setShowSaveVariant('exit');
      setShowSaveWarning(true);
      return;
    }

    setShowConversionProfiles(false);
    setOpenProfileDropdown(null);
    setViewedProfile(conversionProfiles[0]);
    setInitialViewedProfile(conversionProfiles[0]);
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setShowSaveWarning(false);
    setOpenEditConversionProfileDropdown(null);
  }

  const handleConversionProfilesOpen = (create: boolean = false) => {
    setShowConversionProfiles(true);
    setOpenProfileDropdown(null);
    setOpenEditConversionProfileDropdown(null);

    if (create) {
      setViewedProfile(creationDefault);
      setInitialViewedProfile(creationDefault);
    } else {
      setViewedProfile(conversionProfiles[0]);
      setInitialViewedProfile(conversionProfiles[0]);
    }
  }

  const [showSaveWarning, setShowSaveWarning] = useState(false);
  const [showSaveVariant, setShowSaveVariant] = useState<'change' | 'exit' | 'create'>('exit');
  const [viewedProfile, setViewedProfile] = useState<conversionProfile>(conversionProfiles[0]);
  const [viewedProfileDisplay, setViewedProfileDisplay] = useState<conversionProfileDisplay>(getConversionProfileDisplay(conversionProfiles[0]));
  const [initialViewedProfile, setInitialViewedProfile] = useState<conversionProfile>(conversionProfiles[0]);
  const [aliasErrors, setAliasErrors] = useState<string[]>([]);
  const [placeholderErrors, setPlaceholderErrors] = useState<string[]>([]);
  const [nextProfileAlias, setNextProfileAlias] = useState<string>("");

  const hasErrors = aliasErrors.length > 0 || placeholderErrors.length > 0 || viewedProfile.alias.length === 0;
  const hasChanged = !equivalentConversionProfiles(viewedProfile, initialViewedProfile);
  const isDangerous = hasChanged || initialViewedProfile.alias === "";

  useEffect(() => {
    setViewedProfileDisplay(getConversionProfileDisplay(viewedProfile));
  }, [viewedProfile]);

  const maxAliasCharacters = 30;
  const maxPlaceholderCharacters = 200;

  const onProfileSelect = (_event: any, itemId: any) => {
    if (isDangerous && !showSaveWarning) {
      setNextProfileAlias(itemId);
      setShowSaveVariant('change');
      setShowSaveWarning(true);
      return;
    }

    settingsViewContainerRef.current?.scrollTo({ top: 0 });
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setOpenEditConversionProfileDropdown(null);

    const profile = conversionProfiles.find((profile) => profile.alias === itemId);
    
    if (profile) {
      setViewedProfile(profile);
      setInitialViewedProfile(profile);
    }

    setShowSaveWarning(false);
  }

  const getErrors = (value: string | boolean, accessor: keyof conversionProfile): boolean => {
    if (accessor === "alias") {
      const newAlias = value as string;
      let errors: string[] = [];

      if (newAlias.trim() === "") {
        errors.push("Please enter an alias");
      }

      if (conversionProfiles.map(profile => profile.alias).includes(newAlias) && newAlias !== initialViewedProfile.alias) {
        errors.push(`The alias "${newAlias}" is already in use`);
      }

      if (newAlias.length > maxAliasCharacters) {
        errors.push(`${newAlias.length}/${maxAliasCharacters} characters`)
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

  const handleViewedProfileChange = (value: string | boolean, accessor: keyof conversionProfile) => {
    setOpenEditConversionProfileDropdown(null);
    
    if (accessor === "alias") {
      const newAlias = value as string;

      getErrors(newAlias, accessor);
      setViewedProfile(prev => ({ ...prev, [accessor]: newAlias }));
    } else if (accessor === "md_page_break_placeholder") {
      const newPlaceholder = value as string;
      
      getErrors(newPlaceholder, accessor);
      setViewedProfile(prev => ({ ...prev, [accessor]: newPlaceholder }));
    } else {
      setViewedProfile(prev => ({ ...prev, [accessor]: value }));
    }
  }

  const settingsViewContainerRef =  useRef<HTMLDivElement | null>(null);

  const [openEditConversionProfileDropdown, setOpenEditConversionProfileDropdown] = useState<string | null>(null);

  const imageExportModeOptions = [
    {"value": "embedded", "display": "Embedded"},
    {"value": "placeholder", "display": "Placeholder"},
    {"value": "referenced", "display": "Referenced"}
  ];
  const pipelineOptions = [
    {"value": "standard", "display": "Standard"},
    {"value": "vlm", "display": "VLM"}
  ]
  const ocrEngineOptions = [
    {"value": "easyocr", "display": "EasyOCR"},
    {"value": "tesserocr", "display": "Tesseract CLI"},
    {"value": "tesseract", "display": "Tesseract"},
    {"value": "rapidocr", "display": "RapidOCR"},
    {"value": "ocrmac", "display": "OCRMac"}
  ]
  const pdfBackendOptions = [
    {"value": "pypdfium2", "display": "pypdfium2"},
    {"value": "dlparse_v1", "display": "dlparse_v1"},
    {"value": "dlparse_v2", "display": "dlparse_v2"},
    {"value": "dlparse_v4", "display": "dlparse_v4"}
  ]
  const tableModeOptions = [
    {"value": "fast", "display": "Fast"},
    {"value": "accurate", "display": "Accurate"}
  ]

  const handleCreateClick = () => {
    if (initialViewedProfile.alias !== "") {
      if (isDangerous && !showSaveWarning) {
        setShowSaveVariant('create');
        setShowSaveWarning(true);
        return;

      }

      setAliasErrors([]);
      setPlaceholderErrors([]);
      setViewedProfile(creationDefault);
      setInitialViewedProfile(creationDefault);
      setOpenEditConversionProfileDropdown(null);
      setShowSaveWarning(false);
    }
  }

  const handleCreateProfile = () => {
    if (!getErrors(viewedProfile.alias, 'alias') && !getErrors(viewedProfile.md_page_break_placeholder, 'md_page_break_placeholder')) {
      setConversionProfiles((prev) => [...prev, viewedProfile]);
      setInitialViewedProfile(viewedProfile);
    }
  }

  const handleSaveProfile = () => {
    if (!getErrors(viewedProfile.alias, 'alias') && !getErrors(viewedProfile.md_page_break_placeholder, 'md_page_break_placeholder')) {
      setConversionProfiles((prev) => prev.map((profile) => profile.alias === initialViewedProfile.alias ? viewedProfile : profile));
      setInitialViewedProfile(viewedProfile);
    }
  }

  const handleResetChanges = () => {
    setAliasErrors([]);
    setPlaceholderErrors([]);
    setViewedProfile(initialViewedProfile);
    setOpenEditConversionProfileDropdown(null);
  }

  const handleDiscardChanges = () => {
    if (showSaveVariant === 'exit') {
      handleConversionProfilesClose();
    }

    if (showSaveVariant === 'change') {
      onProfileSelect(null, nextProfileAlias);
    }

    if (showSaveVariant === 'create') {
      handleCreateClick();
    }
  }

  const handleDismissWarning = () => {
    setShowSaveWarning(false);
  }

  // ------ TOOLBAR THINGS ------

  const totalFiles = conversionRequiredResources.length + uploadCompleteResources.length;
  const numFilesSelected = selectedConversionRequiredFileNames.length + selectedUploadCompleteFileNames.length;

  const [selectFilesDropdownOpen, setSelectFilesDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setShownConversionRequiredResources(conversionRequiredResources.filter((resource) => resource.file.name.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [conversionRequiredResources, searchQuery]);

  useEffect(() => {
    setShownUploadCompleteResources(uploadCompleteResources.filter((resource) => resource.file.name.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [uploadCompleteResources, searchQuery]);

  return (
    <>
      <ConversionHeader openConversionProfiles={handleConversionProfilesOpen} setShowDocumentation={setShowDocumentation} />
      <Flex style={{ marginTop: '4rem', width: '100%' }}>
        <FlexItem style={{width: '20rem'}} alignSelf={{ default: 'alignSelfFlexStart'}}>
          <FileUpload
            workspaceFiles={workspaceFiles}
            pageFiles={[...conversionRequiredResources.map((r) => r.file), ...uploadCompleteResources.map((r) => r.file)]}
            setResources={onUpload}
          />
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }} alignSelf={{ default: 'alignSelfFlexStart'}}>
          <Card>
            <CardTitle>
              <Flex>
                <FlexItem>
                  Uploaded Resources
                </FlexItem>
                <FlexItem>
                  <Badge style={{ transform: 'translateY(-2.5px)' }} screenReaderText="Uploaded Resources">{[...conversionRequiredResources, ...uploadCompleteResources].length}</Badge>
                </FlexItem>
              </Flex>

              <Toolbar style={{ marginTop: '2.5rem' }}>
                <ToolbarContent>
                  <ToolbarItem key="checkbox">
                    <Dropdown
                      isOpen={selectFilesDropdownOpen}
                      onSelect={() => setSelectFilesDropdownOpen(true)}
                      onOpenChange={(isOpen: boolean) => setSelectFilesDropdownOpen(isOpen)}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() => setSelectFilesDropdownOpen(!selectFilesDropdownOpen)}
                          isExpanded={selectFilesDropdownOpen}
                          splitButtonItems={[
                            <MenuToggleCheckbox 
                              key="split-button-checkbox" 
                              id="split-button-checkbox"
                              onChange={(isSelecting) => selectAllFiles(isSelecting, 'all')}
                              isChecked={numFilesSelected == 0 ? false : numFilesSelected === totalFiles ? true : null}
                            />
                          ]}
                        >
                          {numFilesSelected} selected
                        </MenuToggle>
                      )}
                      shouldFocusToggleOnSelect
                    >
                      <DropdownList>
                        <DropdownItem
                          value={0}
                          key="select-none"
                          onClick={() => selectAllFiles(false, 'all')}
                        >
                          Select none (0 items)
                        </DropdownItem>
                        <DropdownItem
                          value={1}
                          key="select-all"
                          onClick={() => selectAllFiles(true, 'all')}
                        >
                          Select all ({totalFiles} items)
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  </ToolbarItem>
                  <ToolbarItem key="search">
                    <SearchInput 
                      placeholder="Find by name"
                      value={searchQuery}
                      onChange={(_event, value) => setSearchQuery(value)}
                      onClear={() => setSearchQuery('')}
                    />
                  </ToolbarItem>
                  <ToolbarItem key="convert-button">
                    <Button variant="primary">Convert</Button>
                  </ToolbarItem>
                  <ToolbarItem key="actions-menu">
                    <MenuToggle variant="secondary">Actions</MenuToggle>
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </CardTitle>
            <CardBody>
              <Table>
                <Thead className='conversion-required-header'>
                  <Tr className='fat-row'>
                    <Th expand={{
                      areAllExpanded: !isGroupExpanded('conversion-required'),
                      collapseAllAriaLabel: 'Collapse all',
                      onToggle: () => setGroupExpanded('conversion-required', !isGroupExpanded('conversion-required')),
                    }} screenReaderText='Empty'
                    />
                    <Th select={{
                      onSelect: (_event, isSelecting) => selectAllFiles(isSelecting, 'conversion-required'),
                      isSelected: areAllConversionRequiredResourcesSelected && conversionRequiredResources.length > 0
                    }} screenReaderText='Empty'
                    />
                    <Th className='conversion-required-title'>
                      <Flex>
                        <FlexItem>
                          <Icon >
                            <WarningIcon color="#FFCC17" />
                          </Icon>
                        </FlexItem>
                        <FlexItem>
                          <Content component='p' style={{ fontWeight: 'bold' }}>
                            Conversion required
                          </Content>
                        </FlexItem>
                        <FlexItem>
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Conversion Required">{conversionRequiredResources.length}</Badge>
                        </FlexItem>
                      </Flex>
                    </Th>
                    {isGroupExpanded('conversion-required') && shownConversionRequiredResources.length > 0 && (
                      <>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Select conversion profile'>Select conversion profile</Th>
                        <Th screenReaderText='Empty'/>
                      </>
                    )}
                  </Tr>
                </Thead>
                <Tbody>
                  {isGroupExpanded('conversion-required') && shownConversionRequiredResources.map((resource, index) => (
                    <Tr key={index} className='conversion-required-row fat-row'>
                      <Td/>
                      <Td select={{
                          rowIndex: index,
                          isSelected: isResourceSelected(resource),
                          onSelect: (_event, isSelecting) => onSelectResource(resource, index, isSelecting),
                        }}
                      />
                      <Td>{resource.file.name}</Td>
                      <Td>
                        <Flex>
                          <FlexItem>
                            {getfileIcon(resource.file.type)}
                          </FlexItem>
                          <FlexItem>
                            {fileTypeTranslations[resource.file.type] || 'Unknown'}
                          </FlexItem>
                        </Flex>
                      </Td>
                      <Td>{sizeForDisplay(resource.file.size)}</Td>
                      <Td className='conversion-profile-menu-container'>
                        <Dropdown
                          isOpen={resource.file.name === openProfileDropdown}
                          onSelect={() => {setOpenProfileDropdown(resource.file.name)}}
                          onOpenChange={(isOpen: boolean) => {setOpenProfileDropdown(isOpen ? resource.file.name : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle className="conversion-profile-menu" ref={toggleRef} onClick={() => onToggleClick(resource.file.name)} isExpanded={resource.file.name === openProfileDropdown}>
                              {resource.conversionProfile}
                            </MenuToggle>
                          )}
                          ouiaId="ConversionProfileDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            {conversionProfiles.map((profile, idx) => (
                              <DropdownItem
                                value={idx}
                                key={idx}
                                onClick={() => handleProfileSelect(resource, profile)}
                                isSelected={resource.conversionProfile === profile.alias}
                              >
                                {profile.alias}
                              </DropdownItem>
                            ))}
                            <Divider component="li" key="separator" />
                            <DropdownItem
                                value={conversionProfiles.length}
                                key="create"
                                onClick={() => handleConversionProfilesOpen(true)}
                              >
                                Create conversion profile
                              </DropdownItem>
                          </DropdownList>
                        </Dropdown>
                      </Td>
                      <Td className='row-end-menu-container'>
                        <Dropdown
                          popperProps={{ position: 'right' }}
                          isOpen={resource.file.name === openFileActionsDropdown}
                          onSelect={() => {setOpenFileActionsDropdown(resource.file.name)}}
                          onOpenChange={(isOpen: boolean) => {setOpenFileActionsDropdown(isOpen ? resource.file.name : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle icon={<EllipsisVIcon />} variant="plain" ref={toggleRef} onClick={() => {onActionsToggleClick(resource.file.name)}} isExpanded={resource.file.name === openFileActionsDropdown}/>
                          )}
                          ouiaId="FileActionsDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            <DropdownItem
                              value={0}
                              key="view"
                              onClick={() => {handleFileActionSelect(resource, "view")}}
                              isSelected={false}
                            >
                              View file
                            </DropdownItem>
                            <DropdownItem
                              value={1}
                              key="convert"
                              onClick={() => {handleFileActionSelect(resource, "convert")}}
                              isSelected={false}
                            >
                              Convert file
                            </DropdownItem>
                            <Divider component="li" key="separator" />
                            <DropdownItem
                                value={3}
                                key="delete"
                                onClick={() => {handleFileActionSelect(resource, "delete")}}
                                className="danger-item"
                              >
                                Delete file
                              </DropdownItem>
                          </DropdownList>
                        </Dropdown>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Table>
                <Thead className='upload-complete-header'>
                  <Tr className='fat-row'>
                    <Th expand={{
                      areAllExpanded: !isGroupExpanded('upload-complete'),
                      collapseAllAriaLabel: 'Collapse all',
                      onToggle: () => setGroupExpanded('upload-complete', !isGroupExpanded('upload-complete')),
                    }} screenReaderText='Empty'
                    />
                    <Th select={{
                      onSelect: (_event, isSelecting) => selectAllFiles(isSelecting, 'upload-complete'),
                      isSelected: areAllUploadCompleteResourcesSelected && uploadCompleteResources.length > 0
                    }} screenReaderText='Empty'
                    />
                    <Th className="upload-complete-title">
                      <Flex>
                        <FlexItem>
                          <Icon >
                            <CheckCircleIcon color="#3D7317" />
                          </Icon>
                        </FlexItem>
                        <FlexItem>
                          <Content component='p' style={{ fontWeight: 'bold' }}>
                            Upload complete
                          </Content>
                        </FlexItem>
                        <FlexItem>
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Uploaded complete">{uploadCompleteResources.length}</Badge>
                        </FlexItem>
                      </Flex>
                    </Th>
                    {isGroupExpanded('upload-complete') && shownUploadCompleteResources.length > 0 && (
                      <>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Empty'/>
                      </>
                    )}
                  </Tr>
                </Thead>
                <Tbody key='upload-complete'>
                  {isGroupExpanded('upload-complete') && shownUploadCompleteResources.map((resource, index) => (
                    <Tr key={index} className="upload-complete-row fat-row">
                      <Td/>
                      <Td select={{
                        rowIndex: conversionRequiredResources.length + index,
                        isSelected: isResourceSelected(resource),
                        onSelect: (_event, isSelecting) => onSelectResource(resource, conversionRequiredResources.length + index, isSelecting),
                      }}/>
                      <Td>{resource.file.name}</Td>
                      <Td>
                        <Flex>
                          <FlexItem>
                            {getfileIcon(resource.file.type)}
                          </FlexItem>
                          <FlexItem>
                            {fileTypeTranslations[resource.file.type] || 'Unknown'}
                          </FlexItem>
                        </Flex>
                      </Td>
                      <Td>{sizeForDisplay(resource.file.size)}</Td>
                      <Td>{formatDate(resource.datetimeUploaded)}</Td>
                      <Td className='row-end-menu-container'>
                        <Dropdown
                          popperProps={{ position: 'right' }}
                          isOpen={resource.file.name === openFileActionsDropdown}
                          onSelect={() => {setOpenFileActionsDropdown(resource.file.name)}}
                          onOpenChange={(isOpen: boolean) => {setOpenFileActionsDropdown(isOpen ? resource.file.name : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle icon={<EllipsisVIcon />} variant="plain" ref={toggleRef} onClick={() => {onActionsToggleClick(resource.file.name)}} isExpanded={resource.file.name === openFileActionsDropdown}/>
                          )}
                          ouiaId="FileActionsDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            <DropdownItem
                              value={0}
                              key="view"
                              onClick={() => {handleFileActionSelect(resource, "view")}}
                              isSelected={false}
                            >
                              View file
                            </DropdownItem>
                            <DropdownItem
                              value={1}
                              key="convert"
                              onClick={() => {handleFileActionSelect(resource, "convert")}}
                              isSelected={false}
                            >
                              Convert file
                            </DropdownItem>
                            <Divider component="li" key="separator" />
                            <DropdownItem
                                value={3}
                                key="delete"
                                onClick={() => {handleFileActionSelect(resource, "delete")}}
                                className="danger-item"
                              >
                                Delete file
                              </DropdownItem>
                          </DropdownList>
                        </Dropdown>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </FlexItem>
      </Flex>

      <Modal
        isOpen={showConversionProfiles}
        onClose={handleConversionProfilesClose}
        disableFocusTrap
        aria-label="manage conversion profiles"
        aria-labelledby="manage-conversion-profiles-title"
        aria-describedby="manage-conversion-profiles-variant"
        style={{ maxWidth: "min(1600px, 97.5%)" }}
      >
        <ModalHeader
          title="Manage conversion profiles"
          labelId="manage-conversion-profiles-title"
        />
        <ModalBody id="manage-conversion-profiles-variant">
          <Content component="p">
            Select profiles in the left menu to view and edit their settings. Create new profiles to add a new group of settings
          </Content>
          <Flex style={{ marginTop: '2rem' }} columnGap={{ default: 'columnGapLg' }}>
            <FlexItem>
              <Menu className="inset-menu" activeItemId={viewedProfile.alias} onSelect={onProfileSelect} isScrollable>
                <MenuContent>
                  <Flex className="conversion-profiles-header" justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Content component='p'>Conversion Profiles</Content>
                    </FlexItem>
                    <FlexItem>
                      <Button icon={<PlusIcon className={`${initialViewedProfile.alias === "" && 'green-icon'}`}/>} variant="plain" isClicked={initialViewedProfile.alias === ""} onClick={handleCreateClick}  className="create-profile-button" />
                    </FlexItem>
                  </Flex>
                </MenuContent>
                <MenuContent maxMenuHeight="494px">
                  <MenuList>
                    {conversionProfiles.map((profile, index) => (
                      <MenuItem key={index} itemId={profile.alias} isFocused={profile.alias === initialViewedProfile.alias}>
                        {profile.alias}
                      </MenuItem>
                    ))}
                  </MenuList>
                </MenuContent>
              </Menu>
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }} className={`settings-view-container ${initialViewedProfile.alias === "" ? "green-border" : hasChanged ? "blue-border" : ""}`} ref={settingsViewContainerRef}>
              <Content style={{ fontSize: '0.8rem'}} component="p">Want to learn more about these options? Click <Content style={{ fontSize: '0.8rem' }} component="a" href="https://github.com/docling-project/docling-serve/blob/main/docs/usage.md" target="_blank" rel="noopener noreferrer">here</Content> </Content>
              <Flex columnGap={{ default: 'columnGap2xl' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <Flex direction={{ default: 'column' }}>
                    <FlexItem>
                      <Content component="p">Alias:</Content>
                    </FlexItem>
                    <FlexItem>
                      <TextInput
                          aria-label='alias-input'
                          value={viewedProfile.alias}
                          type="text"
                          onChange={(_event, value) => {handleViewedProfileChange(value, "alias")}}
                          isDisabled={!viewedProfile.editable}
                          placeholder='Enter alias...'
                        />
                    </FlexItem>
                    {viewedProfile.editable && (
                      <FlexItem>
                        {aliasErrors.length > 0 ? (
                          <Content style={{ fontSize: '0.7rem', color: '#B1380B'}} component="p">
                            {aliasErrors[0]}
                          </Content>
                        ) : (
                          <Content style={{ fontSize: '0.7rem' }} component="p">
                            {viewedProfile.alias.length}/{maxAliasCharacters} characters
                          </Content>
                        )}
                      </FlexItem>
                    )}
                    <FlexItem>
                      <Content component="p" className="new-option">Image Export Mode:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                          isOpen={openEditConversionProfileDropdown === "image_export_mode"}
                          onSelect={() => {setOpenEditConversionProfileDropdown("image_export_mode")}}
                          onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "image_export_mode" : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "image_export_mode" ? null : "image_export_mode")}} isExpanded={openEditConversionProfileDropdown === "image_export_mode"}>
                              {viewedProfileDisplay.image_export_mode}
                            </MenuToggle>
                          )}
                          ouiaId="ImageExportModeDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            {imageExportModeOptions.map((option, idx) => {
                              return (
                                <DropdownItem
                                  value={idx}
                                  key={option.value}
                                  onClick={() => {handleViewedProfileChange(option.value, "image_export_mode")}}
                                  isSelected={viewedProfile.image_export_mode === option.value}
                                >
                                  {option.display}
                                </DropdownItem>
                              )
                            })}
                          </DropdownList>
                        </Dropdown>
                    </FlexItem>
                    <FlexItem>
                      <Content component="p" className="new-option">OCR Engine:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                          isOpen={openEditConversionProfileDropdown === "ocr_engine"}
                          onSelect={() => {setOpenEditConversionProfileDropdown("ocr_engine")}}
                          onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "ocr_engine" : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "ocr_engine" ? null : "ocr_engine")}} isExpanded={openEditConversionProfileDropdown === "ocr_engine"}>
                              {viewedProfileDisplay.ocr_engine}
                            </MenuToggle>
                          )}
                          ouiaId="OCREngineDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            {ocrEngineOptions.map((option, idx) => {
                              return (
                                <DropdownItem
                                  value={idx}
                                  key={option.value}
                                  onClick={() => {handleViewedProfileChange(option.value, "ocr_engine")}}
                                  isSelected={viewedProfile.ocr_engine === option.value}
                                >
                                  {option.display}
                                </DropdownItem>
                              )
                            })}
                          </DropdownList>
                        </Dropdown>
                    </FlexItem>
                    <FlexItem>
                      <Content component="p" className="new-option">PDF Backend:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                          isOpen={openEditConversionProfileDropdown === "pdf_backend"}
                          onSelect={() => {setOpenEditConversionProfileDropdown("pdf_backend")}}
                          onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "pdf_backend" : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "pdf_backend" ? null : "pdf_backend")}} isExpanded={openEditConversionProfileDropdown === "pdf_backend"}>
                              {viewedProfileDisplay.pdf_backend}
                            </MenuToggle>
                          )}
                          ouiaId="PDFBackendDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            {pdfBackendOptions.map((option, idx) => {
                              return (
                                <DropdownItem
                                  value={idx}
                                  key={option.value}
                                  onClick={() => {handleViewedProfileChange(option.value, "pdf_backend")}}
                                  isSelected={viewedProfile.pdf_backend === option.value}
                                >
                                  {option.display}
                                </DropdownItem>
                              )
                            })}
                          </DropdownList>
                        </Dropdown>
                    </FlexItem>
                    <FlexItem>
                      <Content component="p" className="new-option">Table Mode:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                          isOpen={openEditConversionProfileDropdown === "table_mode"}
                          onSelect={() => {setOpenEditConversionProfileDropdown("table_mode")}}
                          onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "table_mode" : null)}}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "table_mode" ? null : "table_mode")}} isExpanded={openEditConversionProfileDropdown === "table_mode"}>
                              {viewedProfileDisplay.table_mode}
                            </MenuToggle>
                          )}
                          ouiaId="TableModeDropdown"
                          shouldFocusToggleOnSelect
                        >
                          <DropdownList>
                            {tableModeOptions.map((option, idx) => {
                              return (
                                <DropdownItem
                                  value={idx}
                                  key={option.value}
                                  onClick={() => {handleViewedProfileChange(option.value, "table_mode")}}
                                  isSelected={viewedProfile.table_mode === option.value}
                                >
                                  {option.display}
                                </DropdownItem>
                              )
                            })}
                          </DropdownList>
                        </Dropdown>
                    </FlexItem>
                  </Flex>
                </FlexItem>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <Flex direction={{ default: 'column' }}>
                    <FlexItem>
                      <Content component="p" className="new-option">Pipeline Type:</Content>
                    </FlexItem>
                    <FlexItem>
                      <Dropdown
                        isOpen={openEditConversionProfileDropdown === "pipeline"}
                        onSelect={() => {setOpenEditConversionProfileDropdown("pipeline")}}
                        onOpenChange={(isOpen: boolean) => {setOpenEditConversionProfileDropdown(isOpen ? "pipeline" : null)}}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                          <MenuToggle className="manage-conversion-profiles-dropdown" isDisabled={!viewedProfile.editable} ref={toggleRef} onClick={() => {setOpenEditConversionProfileDropdown(openEditConversionProfileDropdown === "pipeline" ? null : "pipeline")}} isExpanded={openEditConversionProfileDropdown === "pipeline"}>
                            {viewedProfileDisplay.pipeline}
                          </MenuToggle>
                        )}
                        ouiaId="PipelineDropdown"
                        shouldFocusToggleOnSelect
                      >
                        <DropdownList>
                          {pipelineOptions.map((option, idx) => {
                            return (
                              <DropdownItem
                                value={idx}
                                key={option.value}
                                onClick={() => {handleViewedProfileChange(option.value, "pipeline")}}
                                isSelected={viewedProfile.pipeline === option.value}
                              >
                                {option.display}
                              </DropdownItem>
                            )
                          })}
                        </DropdownList>
                      </Dropdown>
                    </FlexItem>
                    <FlexItem style={{ marginTop: '1.5rem'}}>
                      <Flex direction={{ default: 'column' }} style={{ justifyItems: 'center'}}>
                        <FlexItem>
                          <Checkbox
                            label="Allow optical character recognition (OCR)"
                            isChecked={viewedProfile.do_ocr}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_ocr")}}
                            id="do-ocr-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Force optical character recognition (OCR)"
                            isChecked={viewedProfile.force_ocr}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "force_ocr")}}
                            id="force-ocr-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Code enrichment"
                            isChecked={viewedProfile.do_code_enrichment}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_code_enrichment")}}
                            id="do-code-enrichment-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Formula enrichment"
                            isChecked={viewedProfile.do_formula_enrichment}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_formula_enrichment")}}
                            id="do-formula-enrichment-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Picture classification"
                            isChecked={viewedProfile.do_picture_classification}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_picture_classification")}}
                            id="do-picture-classification-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Picture description"
                            isChecked={viewedProfile.do_picture_description}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_picture_description")}}
                            id="do-picture-description-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                        <FlexItem>
                          <Checkbox
                            label="Do tables"
                            isChecked={viewedProfile.do_table_structure}
                            onChange={(_event, checked) => {handleViewedProfileChange(checked, "do_table_structure")}}
                            id="do-table-structure-checkbox"
                            isDisabled={!viewedProfile.editable}
                          />
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
              <Flex direction={{ default: 'column' }} style={{ marginTop: '1rem' }}>
                <FlexItem>
                  <Content component="p" className="new-option">Page Break Placeholder:</Content>
                </FlexItem>
                <FlexItem>
                  <TextArea
                    value={viewedProfile.md_page_break_placeholder}
                    onChange={(_event, value) => {handleViewedProfileChange(value, "md_page_break_placeholder")}}
                    resizeOrientation="none"
                    aria-label="placeholder-text-area"
                    placeholder="None"
                    isDisabled={!viewedProfile.editable}
                  />
                </FlexItem>
                {viewedProfile.editable && (
                  <FlexItem>
                    {placeholderErrors.length > 0 ? (
                      <Content style={{ fontSize: '0.7rem', color: '#B1380B'}} component="p">
                        {placeholderErrors[0]}
                      </Content>
                    ) : (
                      <Content style={{ fontSize: '0.7rem' }} component="p">
                        {viewedProfile.md_page_break_placeholder.length}/{maxPlaceholderCharacters} characters
                      </Content>
                    )}
                  </FlexItem>
                )}
              </Flex>
            </FlexItem>
          </Flex>
        </ModalBody>
        <ModalFooter className='conversion-profiles-footer'>
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}  style={{ width: '100%' }}>
            {initialViewedProfile.alias === "" ? (
                <>
                  <FlexItem>
                    <Button variant={`${isDangerous ? 'danger' : 'secondary'}`} onClick={handleConversionProfilesClose}>
                      Exit
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Flex>
                      <FlexItem>
                        <Button variant="secondary" isDisabled={!hasChanged} onClick={handleResetChanges}>
                          Reset to Default
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button isDisabled={hasErrors} onClick={handleCreateProfile}>
                          Create
                        </Button>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                </>
            ) : (
              <>
                <FlexItem>
                  <Button variant={`${isDangerous ? 'danger' : 'secondary'}`} onClick={handleConversionProfilesClose}>
                    Exit
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Flex>
                    <FlexItem>
                      <Button variant="secondary" isDisabled={!hasChanged} onClick={handleResetChanges}>
                        Reset Changes
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button isDisabled={!hasChanged || hasErrors} onClick={handleSaveProfile}>
                        Save Changes
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </>
            )}
          </Flex>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showSaveWarning}
        disableFocusTrap
        variant="small"
        aria-label="unsaved changes warning"
        aria-labelledby="unsaved-changes-warning-title"
        aria-describedby="unsaved-changes-warning-variant"
      >
        <ModalHeader title="Unsaved Changes" labelId="unsaved-changes-warning-title" titleIconVariant="warning" />
        <ModalBody id="unsaved-changes-warning-variant">
          <Content component='p'>Are you sure you want to {showSaveVariant == 'exit' ? 'exit': 'switch profiles'}? Changes have been made to this profile that will not be saved</Content>
        </ModalBody>
        <ModalFooter>
          <Flex>
            <FlexItem>
              <Button key="discard" variant="danger" onClick={handleDiscardChanges}>
                Discard changes
              </Button>
            </FlexItem>

            <FlexItem>
              <Button key="cancel" variant="secondary" onClick={handleDismissWarning}>
                Cancel
              </Button>
            </FlexItem>
          </Flex>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default ConversionStep;