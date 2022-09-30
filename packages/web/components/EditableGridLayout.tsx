import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import {
  Box,
  ButtonGroup,
  CloseIcon,
  ConfirmModal,
  EditIcon,
  Flex,
  MetaButton,
  RepeatClockIcon,
  ResponsiveText,
  useBreakpointValue,
  useToast,
} from '@metafam/ds';
import { Maybe } from '@metafam/utils';
import { AddBoxSection } from 'components/Section/AddBoxSection';
import deepEquals from 'deep-equal';
import { Player } from 'graphql/autogen/types';
import { useBoxHeights } from 'lib/hooks/useBoxHeights';
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Layout, Layouts, Responsive, WidthProvider } from 'react-grid-layout';
import {
  BoxMetadata,
  BoxType,
  BoxTypes,
  createBoxKey,
  gridSX,
  LayoutData,
} from 'utils/boxTypes';
import {
  addBoxToLayouts,
  disableAddBox,
  enableAddBox,
  GRID_ROW_HEIGHT,
  isSameLayouts,
  MULTIPLE_ALLOWED_BOXES,
  removeBoxFromLayouts,
  updatedLayouts,
} from 'utils/layoutHelpers';

const ResponsiveGridLayout = WidthProvider(Responsive);

type Props = {
  player: Player;
  savedLayoutData: LayoutData;
  defaultLayoutData: LayoutData;
  persisting: boolean;
  persistLayoutData: (layoutData: LayoutData) => Promise<void>;
  showEditButton: boolean;
  allBoxOptions: BoxType[];
  displayComponent: (props: {
    ref?: (e: Maybe<HTMLElement>) => void;
    editing?: boolean;
    onRemoveBox?: (boxKey: string) => void;
    metadata?: BoxMetadata;
    type: BoxType;
    player: Player;
  }) => JSX.Element | null;
};

export const EditableGridLayout: React.FC<Props> = ({
  player,
  persisting,
  defaultLayoutData,
  savedLayoutData,
  showEditButton,
  persistLayoutData,
  allBoxOptions,
  displayComponent: DisplaySection,
}): ReactElement => {
  const [saving, setSaving] = useState(false);
  const [exitAlertCancel, setExitAlertCancel] = useState<boolean>(false);
  const [exitAlertReset, setExitAlertReset] = useState<boolean>(false);
  const [changed, setChanged] = useState(false);
  const [editing, setEditing] = useState(false);
  const itemsRef = useRef<Array<Maybe<HTMLElement>>>([]);
  const heights = useBoxHeights(itemsRef.current);
  const mobile = useBreakpointValue({ base: true, sm: false });
  const toast = useToast();

  const [currentLayoutData, setCurrentLayoutData] =
    useState<LayoutData>(savedLayoutData);

  const { layoutItems: currentLayoutItems, layouts: currentLayouts } =
    currentLayoutData;

  useEffect(() => {
    itemsRef.current = itemsRef.current.slice(0, currentLayoutItems.length);
  }, [currentLayoutItems]);

  useEffect(() => {
    const layouts = updatedLayouts(currentLayouts, heights, editing);
    if (!deepEquals(layouts, currentLayouts)) {
      setCurrentLayoutData(({ layoutItems }) => ({
        layouts,
        layoutItems,
      }));
    }
  }, [currentLayouts, heights, editing]);

  const handleReset = useCallback(() => {
    setCurrentLayoutData(enableAddBox(defaultLayoutData));
    setExitAlertReset(false);
  }, [defaultLayoutData]);

  const handleCancel = useCallback(() => {
    setCurrentLayoutData(savedLayoutData);
    setEditing(false);
    setExitAlertCancel(false);
  }, [savedLayoutData]);

  const isDefaultLayout = useMemo(
    () => isSameLayouts(defaultLayoutData, currentLayoutData),
    [currentLayoutData, defaultLayoutData],
  );

  const toggleEditLayout = useCallback(async () => {
    try {
      let layoutData = defaultLayoutData;
      if (editing) {
        setSaving(true);
        layoutData = disableAddBox(currentLayoutData);
        await persistLayoutData(layoutData);
      } else {
        layoutData = enableAddBox(currentLayoutData);
      }
      setCurrentLayoutData(layoutData);
      setEditing((e) => !e);
      setChanged(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: `Unable to save layout. Error: ${(err as Error).message}`,
        status: 'error',
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  }, [editing, currentLayoutData, persistLayoutData, defaultLayoutData, toast]);

  const handleLayoutChange = useCallback(
    (_items: Array<Layout>, layouts: Layouts) => {
      const newData = { layouts, layoutItems: currentLayoutItems };
      // automatic height adjustments dirty `changed`
      setChanged(
        changed || (editing && !isSameLayouts(currentLayoutData, newData)),
      );
      setCurrentLayoutData(newData);
    },
    [currentLayoutData, currentLayoutItems, editing, changed],
  );

  const onRemoveBox = useCallback(
    (boxKey: string): void => {
      const layoutData = {
        layouts: removeBoxFromLayouts(currentLayouts, boxKey),
        layoutItems: currentLayoutItems.filter((item) => item.key !== boxKey),
      };
      setCurrentLayoutData(layoutData);
      setChanged(true);
    },
    [currentLayouts, currentLayoutItems],
  );

  const onAddBox = useCallback(
    (type: BoxType, metadata: BoxMetadata): void => {
      const key = createBoxKey(type, metadata);
      if (currentLayoutItems.find((item) => item.key === key)) {
        return;
      }
      const layoutData = {
        layouts: addBoxToLayouts(currentLayouts, type, metadata),
        layoutItems: [...currentLayoutItems, { type, metadata, key }],
      };

      setCurrentLayoutData(layoutData);
      setChanged(true);
    },
    [currentLayouts, currentLayoutItems],
  );

  const availableBoxes = useMemo(
    () =>
      allBoxOptions.filter(
        (box) =>
          !currentLayoutItems.map(({ type }) => type).includes(box) ||
          MULTIPLE_ALLOWED_BOXES.includes(box),
      ),
    [currentLayoutItems, allBoxOptions],
  );

  return (
    <Box
      className="gridWrapper"
      width="100%"
      height="100%"
      sx={gridSX}
      maxW="96rem"
      mb="12rem"
      pt={showEditButton ? 0 : '4rem'}
    >
      {showEditButton && (
        <ButtonGroup
          w="full"
          mb={4}
          px={8}
          justifyContent="end"
          variant="ghost"
          zIndex={10}
          isAttached
          size={mobile ? 'xs' : 'md'}
        >
          {editing && !isDefaultLayout && (
            <MetaButton
              aria-label="Reset Layout"
              _hover={{ background: 'purple.600' }}
              textTransform="uppercase"
              px={[8, 12]}
              letterSpacing="0.1em"
              onClick={() => setExitAlertReset(true)}
              leftIcon={mobile ? undefined : <RepeatClockIcon />}
            >
              Reset
            </MetaButton>
          )}
          {editing && (
            <MetaButton
              aria-label="Cancel Layout Edit"
              colorScheme="purple"
              _hover={{ background: 'purple.600' }}
              textTransform="uppercase"
              px={[9, 12]}
              letterSpacing="0.1em"
              onClick={() => setExitAlertCancel(true)}
              leftIcon={mobile ? undefined : <CloseIcon />}
            >
              Cancel
            </MetaButton>
          )}
          <ConfirmModal
            isOpen={exitAlertReset}
            onNope={() => setExitAlertReset(false)}
            onYep={handleReset}
            header="Are you sure you want to reset the layout to its default?"
          />
          <ConfirmModal
            isOpen={exitAlertCancel}
            onNope={() => setExitAlertCancel(false)}
            onYep={handleCancel}
            header="Are you sure you want to cancel editing the layout?"
          />
          {(!editing || changed) && (
            <MetaButton
              aria-label="Edit Layout"
              borderColor="transparent"
              background="rgba(17, 17, 17, 0.9)"
              _hover={{ color: 'white' }}
              variant="outline"
              textTransform="uppercase"
              px={[5, 12]}
              letterSpacing="0.1em"
              bg="transparent"
              color={editing ? 'red.400' : 'pinkShadeOne'}
              leftIcon={mobile ? undefined : <EditIcon />}
              transition="color 0.2s ease"
              isLoading={saving || persisting}
              onClick={toggleEditLayout}
            >
              <ResponsiveText
                content={{
                  base: editing ? 'Save' : 'Edit Layout ',
                  md: `${editing ? 'Save' : 'Edit'} Layout`,
                }}
              />
            </MetaButton>
          )}
        </ButtonGroup>
      )}
      <ResponsiveGridLayout
        onLayoutChange={handleLayoutChange}
        layouts={currentLayouts}
        breakpoints={{ lg: 1180, md: 900, sm: 0 }}
        cols={{ lg: 3, md: 2, sm: 1 }}
        rowHeight={GRID_ROW_HEIGHT}
        isDraggable={!!editing}
        isResizable={!!editing}
        margin={{
          lg: [30, 30],
          md: [30, 30],
          sm: [30, 30],
        }}
        containerPadding={{
          lg: [30, 30],
          md: [20, 20],
          sm: [20, 20],
        }}
      >
        {currentLayoutItems.map(({ key, type, metadata }, i) => (
          <Flex
            bg="blueProfileSection"
            boxShadow={editing ? 'lg' : 'md'}
            overflow="hidden"
            borderRadius="lg"
            transition="boxShadow 0.2s 0.3s ease"
            id={key}
            {...{ key }}
          >
            {type === BoxTypes.ADD_NEW_BOX ? (
              <AddBoxSection
                boxes={availableBoxes}
                previewComponent={DisplaySection}
                {...{ player, onAddBox }}
                ref={(e: Maybe<HTMLElement>) => {
                  itemsRef.current[i] = e;
                }}
              />
            ) : (
              <DisplaySection
                {...{
                  type,
                  metadata,
                  player,
                  editing,
                  onRemoveBox,
                }}
                ref={(e: Maybe<HTMLElement>) => {
                  itemsRef.current[i] = e;
                }}
              />
            )}
          </Flex>
        ))}
      </ResponsiveGridLayout>
    </Box>
  );
};