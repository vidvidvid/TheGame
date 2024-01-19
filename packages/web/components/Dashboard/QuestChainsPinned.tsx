import { Flex, HStack, MetaButton, Spinner, Stack, Text } from '@metafam/ds';
import { MetaLink } from 'components/Link';
import { getPlayerPinnedQuestchains } from 'graphql/queries/player';
import { useMounted, useUser, useWeb3 } from 'lib/hooks';
import React, { useEffect, useState } from 'react';
import { GoLinkExternal } from 'react-icons/go';

export const QuestChainsPinned: React.FC = () => {
  const { user } = useUser();
  const mounted = useMounted();
  const { connect, connecting, connected } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);

  const [pinnedQuestChains, setPinnedQuestChains] = useState<
    Array<{
      id: any;
      questchain_id: string;
    }>
  >([]);

  useEffect(() => {
    const getPinnedQuestChains = async (playerId: string) => {
      try {
        const pinnedQCs = await getPlayerPinnedQuestchains(playerId);
        if (pinnedQCs) {
          setPinnedQuestChains(pinnedQCs.pinned_questchains);
        }
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.error('Failed to get pinned quest chains:', error);
      }
    };
    if (user?.id) getPinnedQuestChains(user.id);
  }, [setPinnedQuestChains, user?.id]);

  const extractQuestChainName = (questchainId: string) =>
    questchainId.split('-')[1];

  const formatUrl = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  if (!mounted || (!connecting && !connected)) {
    return (
      <Flex direction="column" align="center" justify="center" h="17rem">
        <Text textAlign="center">
          <MetaButton onClick={connect}>Connect</MetaButton>
          <Text>to see your pinned Quest Chains</Text>
        </Text>
      </Flex>
    );
  }

  if (isLoading) {
    return (
      <Stack p={6} w="100%" gap={4}>
        <Text fontSize="lg" fontWeight="bold" textTransform="uppercase">
          Pinned Quest Chains
        </Text>
        <Spinner />
      </Stack>
    );
  }

  return (
    <Stack p={6} w="100%" gap={4}>
      <Text fontSize="lg" fontWeight="bold" textTransform="uppercase">
        Pinned Quest Chains
      </Text>
      {pinnedQuestChains.length > 0 ? (
        <Stack spacing={3}>
          {pinnedQuestChains.map((qc) => (
            <MetaLink
              href={`/academy/${formatUrl(
                extractQuestChainName(qc.questchain_id),
              )}`}
              key={qc.id}
              w="100%"
            >
              <HStack
                display="flex"
                width="100%"
                maxW="100%"
                px={3}
                py={2}
                fontSize={['sm', 'md']}
                flexFlow="row nowrap"
                alignItems="center"
                justifyContent="flex-start"
                backgroundColor="blackAlpha.500"
                borderRadius="md"
                overflow="hidden"
                _hover={{
                  boxShadow: 'md',
                  backgroundColor: 'blackAlpha.600',
                }}
              >
                <Text>{extractQuestChainName(qc.questchain_id)}</Text>
                <GoLinkExternal />
              </HStack>
            </MetaLink>
          ))}
        </Stack>
      ) : (
        <Text>
          You haven't started any Quest Chains yet. Visit the{' '}
          <MetaLink href="/academy">Academy</MetaLink> to get started!
        </Text>
      )}
    </Stack>
  );
};