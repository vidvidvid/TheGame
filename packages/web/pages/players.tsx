import { LoadingState, Text, VStack } from '@metafam/ds';
import { PageContainer } from 'components/Container';
import { PlayerFilter } from 'components/Player/PlayerFilter';
import { PlayerList } from 'components/Player/PlayerList';
import { HeadComponent } from 'components/Seo';
import { getSsrClient } from 'graphql/client';
import { getPlayerFilters, getPlayersWithCount } from 'graphql/getPlayers';
import { usePlayerFilter } from 'lib/hooks/players';
import { InferGetStaticPropsType } from 'next';
import React, { useCallback, useEffect, useRef } from 'react';

type Props = InferGetStaticPropsType<typeof getStaticProps>;

export const getStaticProps = async () => {
  const [ssrClient, ssrCache] = getSsrClient();

  // This populates the cache server-side
  const { error } = await getPlayersWithCount(undefined, ssrClient);
  if (error) {
    // eslint-disable-next-line no-console
    console.error('getPlayers error', error);
  }
  await getPlayerFilters(ssrClient);

  return {
    props: {
      urqlState: ssrCache.extractData(),
    },
    revalidate: 1,
  };
};

const Players: React.FC<Props> = () => {
  const {
    players,
    aggregates,
    fetching,
    fetchingMore,
    error,
    queryVariables,
    setQueryVariable,
    resetFilter,
    totalCount,
    nextPage,
    moreAvailable,
  } = usePlayerFilter();

  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(
    (entries) => {
      if (entries[0].isIntersecting) {
        nextPage();
      }
    },
    [nextPage],
  );

  useEffect(() => {
    const cachedRef = loaderRef.current as Element;

    const observer = new IntersectionObserver(loadMore, {
      threshold: 0.25,
      rootMargin: '100%',
    });
    observer.observe(cachedRef);

    return () => observer.unobserve(cachedRef);
  }, [loadMore]);

  return (
    <PageContainer>
      <HeadComponent url="https://my.metagame.wtf/players" />
      <VStack w="100%" spacing="8" pb={{ base: '16', lg: '0' }}>
        <PlayerFilter
          fetching={fetching}
          aggregates={aggregates}
          queryVariables={queryVariables}
          setQueryVariable={setQueryVariable}
          resetFilter={resetFilter}
          totalCount={totalCount}
        />
        {error && <Text>{`Error: ${error.message}`}</Text>}
        {!error && players.length && (fetchingMore || !fetching) && (
          <PlayerList players={players} />
        )}
        <VStack ref={loaderRef} w="100%">
          {fetching || fetchingMore || moreAvailable ? (
            <LoadingState color="white" />
          ) : (
            <Text color="white">
              {totalCount > 0
                ? 'No more players available'
                : 'There were no matches'}
            </Text>
          )}
        </VStack>
      </VStack>
    </PageContainer>
  );
};

export default Players;
